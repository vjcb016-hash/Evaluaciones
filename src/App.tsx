import { BrowserRouter, Route, Routes } from 'react-router'
import Portada from './paginas/Portada'
import PaginaEvaluacion from './paginas/Evaluacion'
import { NoEncontrada } from './pantallas/Aviso'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Portada />} />
        <Route path="/e/:slug" element={<PaginaEvaluacion />} />
        <Route path="*" element={<NoEncontrada />} />
      </Routes>
    </BrowserRouter>
  )
}
