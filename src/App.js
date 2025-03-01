import { Route, Routes } from 'react-router-dom';
import ServerTest from './pages/ServerTest';
import Login from './pages/Login';
import Dash from './pages/Dash';
import PageNotFound from './pages/PageNotFound'

function App() {
  return (
    <div>
      <Routes>
        <Route path='/server' element={<ServerTest />} />
        <Route path='/login' element={<Login />} />
        <Route path='/home' element={<Dash />} />
        <Route path='*' element={<PageNotFound />} />
      </Routes>
    </div>
  );
}

export default App;
