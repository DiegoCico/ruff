import csv
import re
import os
import math
import string
import matplotlib.pyplot as plt
from nltk.sentiment.vader import SentimentIntensityAnalyzer
from rapidfuzz import fuzz  # For fuzzy string matching
import spacy  # For named entity recognition
import contractions  # To expand contractions

# Load spaCy's small English model.
nlp = spacy.load("en_core_web_sm")

# Define a dictionary of colloquial phrases and their normalized forms.
COLLOQUIAL_MAP = {
    "i've": "i have",
    "i'm": "i am",
    "gonna": "going to",
    "wanna": "want to",
    "gotta": "have to",
    "a lot of": "many",
    "lots of": "many",
    "fever going in and out": "intermittent fever",
    "fever coming and going": "intermittent fever",
    "migraine headaches": "migraine",
    "migraines": "migraine",
    "headaches": "headache",
    "head pain": "headache",
    "tummy ache": "abdominal pain",
    "stomach ache": "abdominal pain",
    "puking": "vomiting",
    "throwing up": "vomiting",
    "feelin": "feeling",
    "ain't": "is not",
    "coughin": "coughing",
    "dizzy spells": "dizziness",
    # Add more phrases as needed
}

def apply_colloquial_replacements(text):
    """
    Replace colloquial expressions with their normalized counterparts.
    """
    for phrase, replacement in COLLOQUIAL_MAP.items():
        pattern = re.compile(re.escape(phrase), re.IGNORECASE)
        text = pattern.sub(replacement, text)
    return text

DISEASES = []
PATH = "backend/data/stanford.tsv"

def load_diseases(tsv_path=PATH):
    """
    Loads disease data from a TSV file.
    Expected TSV headers: Disease(DOID), Name, Definition, Synonym.
    """
    global DISEASES
    DISEASES = []
    try:
        with open(tsv_path, "r", encoding="utf-8") as file:
            reader = csv.DictReader(file, delimiter="\t")
            for row in reader:
                # Clean header keys (remove '#' if present and extra spaces).
                cleaned = {k.strip("# ").strip(): v.strip() for k, v in row.items()}
                DISEASES.append(cleaned)
        print(f"Loaded {len(DISEASES)} diseases from {tsv_path}.")
    except Exception as e:
        print("Error loading diseases TSV:", e)

def normalize_text(text):
    """
    Normalize input text by applying the following steps:
      1. Expand contractions (e.g. "I've" -> "I have").
      2. Replace colloquial expressions using a predefined dictionary.
      3. Remove punctuation.
      4. Lemmatize tokens using spaCy.
      5. Lowercase the resulting text.
    This helps capture both casual and formal expressions.
    """
    # Expand contractions
    text = contractions.fix(text)
    # Apply colloquial replacements
    text = apply_colloquial_replacements(text)
    # Remove punctuation
    text = text.translate(str.maketrans("", "", string.punctuation))
    # Process with spaCy and lemmatize
    doc = nlp(text)
    normalized = " ".join([token.lemma_ for token in doc])
    return normalized.lower()

def softmax(scores):
    """
    Converts a list of scores into probabilities using the softmax function.
    Handles empty score list gracefully.
    """
    if not scores:
        return []
    exp_scores = [math.exp(score) for score in scores]
    sum_exp_scores = sum(exp_scores)
    if sum_exp_scores == 0:
        return [1 / len(scores)] * len(scores)
    return [exp_score / sum_exp_scores for exp_score in exp_scores]

def analyze_transcription(transcription):
    """
    Analyze your symptom description by matching your normalized words
    against our disease database using exact and fuzzy matching.
    Returns the top three candidate conditions with:
      - computed probabilities (via softmax)
      - a detailed breakdown of the matches
      - a confidence indicator.
    """
    normalized_text = normalize_text(transcription)
    scored_diseases = []

    for disease in DISEASES:
        score = 0
        breakdown = {
            "exact_match_name": False,
            "fuzzy_match_name_score": 0,
            "exact_match_tokens": [],
            "fuzzy_match_tokens": []
        }
        matched_keywords = []

        # Retrieve disease name and synonyms.
        name = disease.get("Name", "").lower()
        synonyms = disease.get("Synonym", "").lower()
        
        # Check the disease name: exact then fuzzy matching.
        if name:
            if re.search(r'\b' + re.escape(name) + r'\b', normalized_text):
                score += 2
                breakdown["exact_match_name"] = True
                matched_keywords.append(name)
            else:
                ratio = fuzz.partial_ratio(name, normalized_text)
                if ratio > 80:
                    fuzzy_score = 2 * (ratio / 100)
                    score += fuzzy_score
                    breakdown["fuzzy_match_name_score"] = round(fuzzy_score, 2)
                    matched_keywords.append(name + f" (fuzzy:{ratio})")
        
        # Process synonyms: tokenize and match.
        if synonyms:
            tokens = re.split(r'[\s,\[\]]+', synonyms)
            for token in tokens:
                if token:
                    if re.search(r'\b' + re.escape(token) + r'\b', normalized_text):
                        score += 1
                        breakdown["exact_match_tokens"].append(token)
                        matched_keywords.append(token)
                    else:
                        ratio = fuzz.partial_ratio(token, normalized_text)
                        if ratio > 80:
                            fuzzy_token_score = 1 * (ratio / 100)
                            score += fuzzy_token_score
                            breakdown["fuzzy_match_tokens"].append({token: round(fuzzy_token_score, 2)})
                            matched_keywords.append(token + f" (fuzzy:{ratio})")
        
        # Determine confidence.
        if score >= 4:
            confidence = "High"
        elif score >= 2:
            confidence = "Medium"
        else:
            confidence = "Low"
        
        scored_diseases.append((disease, score, breakdown, matched_keywords, confidence))
    
    # Sort and select top three.
    scored_diseases.sort(key=lambda x: x[1], reverse=True)
    top3 = scored_diseases[:3]
    
    scores = [item[1] for item in top3]
    probabilities = softmax(scores)
    
    results = []
    for (disease, raw_score, breakdown, keywords, confidence), prob in zip(top3, probabilities):
        doid = disease.get("Disease(DOID)", "N/A")
        name = disease.get("Name", "N/A")
        definition = disease.get("Definition", "N/A")
        synonyms = disease.get("Synonym", "N/A")
        urls = re.findall(r'https?://[^\s,\]]+', definition)
        
        results.append({
            "doid": doid,
            "name": name,
            "description": definition,
            "synonyms": synonyms,
            "urls": urls,
            "raw_score": round(raw_score, 2),
            "score_breakdown": breakdown,
            "matched_keywords": keywords,
            "confidence": confidence,
            "probability": round(prob, 2)
        })
    
    return results

def analyze_call_logistics(transcription):
    """
    Uses sentiment analysis (VADER) to gauge the tone of your description.
    Returns sentiment scores and an overall tone.
    """
    sia = SentimentIntensityAnalyzer()
    sentiment_scores = sia.polarity_scores(transcription)
    compound = sentiment_scores['compound']
    
    if compound >= 0.5:
        predominant_tone = "very positive"
    elif compound > 0.1:
        predominant_tone = "positive"
    elif compound < -0.5:
        predominant_tone = "very negative"
    elif compound < -0.1:
        predominant_tone = "negative"
    else:
        predominant_tone = "neutral"
    
    return {
        "sentiment_scores": sentiment_scores,
        "predominant_tone": predominant_tone
    }

def analyze_named_entities(transcription):
    """
    Extracts named entities (like dates, locations, or numbers) from your description.
    Returns a list of these entities.
    """
    doc = nlp(transcription)
    entities = [{"text": ent.text, "label": ent.label_} for ent in doc.ents]
    return entities

def visualize_disease_probabilities(disease_results):
    """
    Creates a bar chart of the candidate conditions’ probabilities.
    """
    names = [res["name"] for res in disease_results]
    probs = [res["probability"] for res in disease_results]
    
    plt.figure()
    plt.bar(names, probs)
    plt.xlabel("Candidate Condition")
    plt.ylabel("Probability")
    plt.title("Condition Probabilities Based on Your Symptoms")
    plt.show()

def analyze_report(transcription):
    """
    Combines analysis of your symptom description, tone, and extra details into a report.
    The report includes:
      - Top candidate conditions with match details.
      - A patient-friendly summary.
    """
    diseases = analyze_transcription(transcription)
    call_logistics = analyze_call_logistics(transcription)
    named_entities = analyze_named_entities(transcription)
    
    summary_lines = []
    if diseases:
        top = diseases[0]
        summary_lines.append(
            f"Based on what you described, it appears you might be showing signs of '{top['name']}' with {top['confidence']} confidence (estimated probability: {top['probability']})."
        )
    else:
        summary_lines.append("We couldn’t clearly match your symptoms to a specific condition.")
    
    if named_entities:
        entity_list = ", ".join([f"{ent['text']} ({ent['label']})" for ent in named_entities])
        summary_lines.append(f"Additional details we noticed: {entity_list}.")
    else:
        summary_lines.append("No extra details were detected in your description.")
    
    summary_lines.append("Note: This analysis is based solely on your description and is not a formal medical diagnosis.")
    summary = "\n".join(summary_lines)
    
    return {
        "diseases": diseases,
        "call_logistics": call_logistics,
        "named_entities": named_entities,
        "summary": summary
    }

# Load diseases when the module is imported.
load_diseases()

# Example usage:
if __name__ == "__main__":
    sample_transcription = (
        "I've been having a lot of migraines for the past few days, and my fever keeps coming and going. "
        "Sometimes I feel really weak too."
    )
    report = analyze_report(sample_transcription)
    print("=== Your Symptom Analysis Report ===")
    print(report["summary"])
    print("\nDetailed Candidate Conditions:")
    for disease in report["diseases"]:
        print(disease)
    print("\nTone & Sentiment Analysis:")
    print(report["call_logistics"])
    print("\nExtracted Details:")
    print(report["named_entities"])
    
    # Display a chart of candidate condition probabilities.
    visualize_disease_probabilities(report["diseases"])
