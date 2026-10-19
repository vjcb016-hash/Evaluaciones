import { BrowserRouter, Route, Routes } from 'react-router'
import Portada from './paginas/Portada'
import PaginaEvaluacion from './paginas/Evaluacion'
import { NoEncontrada } from './pantallas/Aviso'
import { configuracionFaltante } from './datos/supabase'

export default function App() {
  if (configuracionFaltante) {
    return (
      <main className="mx-auto max-w-[600px] px-4 py-10">
        <h1 className="font-titulo text-2xl font-bold">Falta configurar Supabase</h1>
        <p className="mt-2 text-texto-2">
          Creá el archivo <code>.env.local</code> (copiando <code>.env.example</code>) con la URL y la clave pública
          del proyecto, y reiniciá el servidor.
        </p>
      </main>
    )
  }

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
