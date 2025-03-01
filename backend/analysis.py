import csv
import re
import os
import math
import matplotlib.pyplot as plt
from nltk.sentiment.vader import SentimentIntensityAnalyzer
from rapidfuzz import fuzz  # For fuzzy string matching
import spacy  # For named entity recognition

# Load spaCy's small English model.
nlp = spacy.load("en_core_web_sm")

DISEASES = []
# Update the PATH variable if your TSV file is located elsewhere.
PATH = "./data/stanford.tsv"

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

def softmax(scores):
    """
    Converts a list of scores into probabilities using the softmax function.
    Handles empty score list gracefully.
    """
    if not scores:  # Check for empty list
        return []
    exp_scores = [math.exp(score) for score in scores]
    sum_exp_scores = sum(exp_scores)
    if sum_exp_scores == 0:
        # Avoid division by zero; return equal probabilities
        return [1 / len(scores)] * len(scores)
    return [exp_score / sum_exp_scores for exp_score in exp_scores]

def analyze_transcription(transcription):
    """
    Analyze the transcription text by matching keywords from the disease data.
    Uses both exact (word-boundary) and fuzzy matching to improve accuracy.
    Returns the top three diseases with:
      - computed probabilities (via softmax)
      - a detailed score breakdown (exact & fuzzy matches)
      - a confidence indicator.
    """
    transcription_lower = transcription.lower()
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

        # Retrieve and lower-case the disease name and synonyms.
        name = disease.get("Name", "").lower()
        synonyms = disease.get("Synonym", "").lower()
        
        # Process disease name: Exact match then fuzzy matching.
        if name:
            if re.search(r'\b' + re.escape(name) + r'\b', transcription_lower):
                score += 2
                breakdown["exact_match_name"] = True
                matched_keywords.append(name)
            else:
                ratio = fuzz.partial_ratio(name, transcription_lower)
                if ratio > 80:
                    fuzzy_score = 2 * (ratio / 100)
                    score += fuzzy_score
                    breakdown["fuzzy_match_name_score"] = round(fuzzy_score, 2)
                    matched_keywords.append(name + f" (fuzzy:{ratio})")
        
        # Process synonyms: Tokenize and apply both matching techniques.
        if synonyms:
            tokens = re.split(r'[\s,\[\]]+', synonyms)
            for token in tokens:
                if token:
                    if re.search(r'\b' + re.escape(token) + r'\b', transcription_lower):
                        score += 1
                        breakdown["exact_match_tokens"].append(token)
                        matched_keywords.append(token)
                    else:
                        ratio = fuzz.partial_ratio(token, transcription_lower)
                        if ratio > 80:
                            fuzzy_token_score = 1 * (ratio / 100)
                            score += fuzzy_token_score
                            breakdown["fuzzy_match_tokens"].append({token: round(fuzzy_token_score, 2)})
                            matched_keywords.append(token + f" (fuzzy:{ratio})")
        
        # Determine confidence based on raw score.
        if score >= 4:
            confidence = "High"
        elif score >= 2:
            confidence = "Medium"
        else:
            confidence = "Low"
        
        scored_diseases.append((disease, score, breakdown, matched_keywords, confidence))
    
    # Sort diseases by raw score (highest first) and select the top three.
    scored_diseases.sort(key=lambda x: x[1], reverse=True)
    top3 = scored_diseases[:3]
    
    # Extract scores for softmax. If no diseases are loaded, return empty list.
    scores = [item[1] for item in top3]
    probabilities = softmax(scores)
    
    # Build the results list with additional information.
    results = []
    for (disease, raw_score, breakdown, keywords, confidence), prob in zip(top3, probabilities):
        doid = disease.get("Disease(DOID)", "N/A")
        name = disease.get("Name", "N/A")
        definition = disease.get("Definition", "N/A")
        synonyms = disease.get("Synonym", "N/A")
        # Extract URLs from the definition field.
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
    Performs sentiment analysis on the transcription text using NLTK's VADER.
    Returns detailed sentiment scores and a predominant tone classification.
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
    Uses spaCy to extract named entities from the transcription.
    Returns a list of entities with their text and labels.
    """
    doc = nlp(transcription)
    entities = [{"text": ent.text, "label": ent.label_} for ent in doc.ents]
    return entities

def visualize_disease_probabilities(disease_results):
    """
    Generates a bar chart for the top candidate diseases' probabilities.
    """
    names = [res["name"] for res in disease_results]
    probs = [res["probability"] for res in disease_results]
    
    plt.figure()
    plt.bar(names, probs)
    plt.xlabel("Disease")
    plt.ylabel("Probability")
    plt.title("Top Candidate Disease Probabilities")
    plt.show()

def analyze_report(transcription):
    """
    Combines the disease analysis, sentiment analysis, and named entity recognition
    into a single report.
    
    Returns a dictionary with:
      - A list of top three candidate diseases (with detailed score breakdowns)
      - Call logistics (tone & sentiment)
      - Named entities extracted from the transcription
      - A summary section highlighting key findings.
    """
    diseases = analyze_transcription(transcription)
    call_logistics = analyze_call_logistics(transcription)
    named_entities = analyze_named_entities(transcription)
    
    summary_lines = []
    if diseases:
        top = diseases[0]
        summary_lines.append(f"Top candidate disease is '{top['name']}' with {top['confidence']} confidence (probability: {top['probability']}).")
    else:
        summary_lines.append("No candidate diseases were identified.")
    
    if named_entities:
        entity_list = ", ".join([f"{ent['text']} ({ent['label']})" for ent in named_entities])
        summary_lines.append(f"Named entities detected: {entity_list}.")
    else:
        summary_lines.append("No significant named entities were detected.")
    
    summary = "\n".join(summary_lines)
    
    return {
        "diseases": diseases,
        "call_logistics": call_logistics,
        "named_entities": named_entities,
        "summary": summary
    }

# Load diseases when the module is imported.
load_diseases()

# Example usage (if running interactively):
if __name__ == "__main__":
    sample_transcription = (
        "The patient exhibits symptoms similar to angiosarcoma, including abnormal blood vessel growth. "
        "There are also indications of metabolic issues and possible signs of chikungunya fever."
    )
    report = analyze_report(sample_transcription)
    print("=== Analysis Report ===")
    print(report["summary"])
    print("\nDetailed Disease Candidates:")
    for disease in report["diseases"]:
        print(disease)
    print("\nCall Logistics:")
    print(report["call_logistics"])
    print("\nNamed Entities:")
    print(report["named_entities"])
    
    # Visualize the disease probabilities.
    visualize_disease_probabilities(report["diseases"])
