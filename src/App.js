import { Route, Routes } from 'react-router-dom';
import ServerTest from './pages/ServerTest';
import LoginSignup from './pages/LoginSignup';
import Dash from './pages/Dash';
import PageNotFound from './pages/PageNotFound'

function App() {
  return (
    <div>
      <Routes>
        <Route path='/server' element={<ServerTest />} />
        <Route path='/login' element={<LoginSignup />} />
        <Route path='/home/:uid' element={<Dash />} />
        <Route path='*' element={<PageNotFound />} />
      </Routes>
    </div>
  );
}

export default App;
