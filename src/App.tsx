import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import PaginaEvaluacion from './paginas/Evaluacion'
import { Cargando, NoEncontrada } from './pantallas/Aviso'
import { configuracionFaltante } from './datos/supabase'

// El panel se descarga aparte: el celular del participante no lo baja nunca.
const PanelLayout = lazy(() => import('./paginas/panel/PanelLayout'))
const ListaEvaluaciones = lazy(() => import('./paginas/panel/ListaEvaluaciones'))
const NuevaEvaluacion = lazy(() => import('./paginas/panel/FormEvaluacion'))
const DetalleEvaluacion = lazy(() => import('./paginas/panel/DetalleEvaluacion'))

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
      <Suspense fallback={<Cargando />}>
        <Routes>
          <Route path="/" element={<Navigate to="/panel" replace />} />
          <Route path="/e/:slug" element={<PaginaEvaluacion />} />
          <Route path="/panel" element={<PanelLayout />}>
            <Route index element={<ListaEvaluaciones />} />
            <Route path="nueva" element={<NuevaEvaluacion />} />
            <Route path="e/:id" element={<DetalleEvaluacion />} />
          </Route>
          <Route path="*" element={<NoEncontrada />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
