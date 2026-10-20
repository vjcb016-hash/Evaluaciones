import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { LogoMarca } from '../../componentes/LogoMarca'
import {
  cambiarNotasLiberadas,
  cerrarHabilitacion,
  estadoDe,
  habilitar,
  linkParticipante,
  type EvaluacionFila,
  type HabilitacionFila,
} from '../../datos/panel'
import { formatearFechaHora, formatearHora, formatearRestante, useAhora } from '../../lib/tiempo'
import { Aviso, BotonP, Tarjeta, claseInput } from './ui'

const DURACIONES: [number, string][] = [
  [0.5, '30 minutos'],
  [1, '1 hora'],
  [2, '2 horas'],
  [3, '3 horas'],
  [4, '4 horas'],
  [8, '8 horas'],
  [24, '1 día'],
  [72, '3 días'],
  [168, '1 semana'],
]

export function SeccionHabilitacion({
  evaluacion,
  habilitaciones,
  sinPreguntas,
  onCambio,
}: {
  evaluacion: EvaluacionFila
  habilitaciones: HabilitacionFila[]
  sinPreguntas: boolean
  onCambio: () => Promise<void>
}) {
  const ahora = useAhora(1000)
  const estado = estadoDe(habilitaciones, ahora)
  const ultima = habilitaciones[0]
  const [horas, setHoras] = useState(2)
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function hacer(accion: () => Promise<void>) {
    setOcupado(true)
    setError(null)
    try {
      await accion()
      await onCambio()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setOcupado(false)
    }
  }

  return (
    <Tarjeta
      titulo="Habilitación y QR"
      descripcion="Los participantes solo pueden responder mientras la evaluación está abierta."
    >
      <div className="flex flex-col gap-4">
        {estado.tipo === 'abierta' ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-ok-fondo px-4 py-3 text-ok">
            <div>
              <p className="font-bold">Abierta · quedan {formatearRestante(Date.parse(estado.habilitacion.cierra_en) - ahora)}</p>
              <p className="text-[15px]">
                Desde las {formatearHora(estado.habilitacion.abierta_en)} hasta el{' '}
                {formatearFechaHora(estado.habilitacion.cierra_en)}.
              </p>
            </div>
            <BotonP
              variante="peligro"
              disabled={ocupado}
              onClick={() => {
                if (confirm('¿Cerrar la evaluación ahora? Nadie más va a poder enviar respuestas.'))
                  hacer(() => cerrarHabilitacion(estado.habilitacion.id))
              }}
            >
              Cerrar ahora
            </BotonP>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-[15px] text-texto-2">
              {estado.tipo === 'nunca'
                ? 'Todavía no se habilitó nunca.'
                : estado.habilitacion.cerrada_por_instructor
                  ? `Cerrada. Se habilitó el ${formatearFechaHora(estado.habilitacion.abierta_en)}.`
                  : `Cerró sola el ${formatearFechaHora(estado.habilitacion.cierra_en)}.`}
            </p>
            {sinPreguntas ? (
              <Aviso tipo="info">Primero cargá las preguntas para poder habilitarla.</Aviso>
            ) : (
              <div className="flex flex-wrap items-end gap-2">
                <label className="flex flex-col gap-1.5">
                  <span className="font-semibold">Abierta durante</span>
                  <select value={horas} onChange={(e) => setHoras(Number(e.target.value))} className={`${claseInput} w-44`}>
                    {DURACIONES.map(([h, texto]) => (
                      <option key={h} value={h}>
                        {texto}
                      </option>
                    ))}
                  </select>
                </label>
                <BotonP disabled={ocupado} onClick={() => hacer(() => habilitar(evaluacion.id, horas))}>
                  {ocupado ? 'Habilitando…' : 'Habilitar ahora'}
                </BotonP>
              </div>
            )}
            {estado.tipo === 'cerrada' && !sinPreguntas && (
              <p className="text-sm text-texto-2">
                Cada habilitación es nueva: quienes ya respondieron antes van a poder responder otra vez.
              </p>
            )}
          </div>
        )}

        {evaluacion.modo_resultado === 'liberar' && ultima && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/10 px-4 py-3">
            <p className="text-[15px]">
              {ultima.notas_liberadas ? (
                <>
                  <strong>Notas liberadas.</strong> Los participantes ya ven su resultado.
                </>
              ) : (
                <>
                  <strong>Notas sin liberar.</strong> Los participantes están esperando.
                </>
              )}
            </p>
            {ultima.notas_liberadas ? (
              <BotonP variante="texto" disabled={ocupado} onClick={() => hacer(() => cambiarNotasLiberadas(ultima.id, false))}>
                Ocultar de nuevo
              </BotonP>
            ) : (
              <BotonP disabled={ocupado} onClick={() => hacer(() => cambiarNotasLiberadas(ultima.id, true))}>
                Liberar notas
              </BotonP>
            )}
          </div>
        )}

        {error && <Aviso tipo="error">{error}</Aviso>}

        <BloqueQR evaluacion={evaluacion} />
      </div>
    </Tarjeta>
  )
}

function BloqueQR({ evaluacion }: { evaluacion: EvaluacionFila }) {
  const link = linkParticipante(evaluacion.slug)
  const [qr, setQr] = useState<string | null>(null)
  const [copiado, setCopiado] = useState<string | null>(null)
  const [grande, setGrande] = useState(false)
  const campo = useRef<HTMLInputElement>(null)
  const esLocal = ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)

  useEffect(() => {
    QRCode.toDataURL(link, { width: 720, margin: 2, errorCorrectionLevel: 'M', color: { dark: '#1B1B1B' } })
      .then(setQr)
      .catch(() => setQr(null))
  }, [link])

  async function copiar() {
    try {
      await navigator.clipboard.writeText(link)
      setCopiado('Link copiado.')
    } catch {
      campo.current?.select()
      setCopiado('Seleccioné el link: copialo con Ctrl+C.')
    }
  }

  return (
    <div className="flex flex-col gap-4 border-t border-black/5 pt-4 sm:flex-row">
      <div className="mx-auto shrink-0 sm:mx-0">
        {qr ? (
          <img src={qr} alt={`Código QR de ${link}`} className="h-44 w-44 rounded-xl border border-black/10" />
        ) : (
          <div className="h-44 w-44 rounded-xl bg-black/5" />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <label htmlFor="link-participantes" className="font-semibold">
          Link para los participantes
        </label>
        <input
          id="link-participantes"
          ref={campo}
          readOnly
          value={link}
          onFocus={(e) => e.target.select()}
          className={`${claseInput} font-mono text-[14px]`}
        />
        <div className="flex flex-wrap gap-2">
          <BotonP variante="secundario" onClick={copiar}>
            Copiar link
          </BotonP>
          {qr && (
            <a
              href={qr}
              download={`qr-${evaluacion.slug}.png`}
              className="inline-flex h-11 items-center rounded-xl border border-black/15 bg-white px-4 text-[15px] font-semibold hover:bg-black/5"
            >
              Descargar QR
            </a>
          )}
          <BotonP variante="secundario" onClick={() => setGrande(true)} disabled={!qr}>
            Pantalla grande
          </BotonP>
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 items-center rounded-xl px-4 text-[15px] font-semibold text-acento hover:bg-tinte"
          >
            Abrir como participante ↗
          </a>
        </div>
        {copiado && <p className="text-sm font-semibold text-ok">{copiado}</p>}
        {esLocal && (
          <Aviso tipo="info">
            Estás abriendo el panel con «localhost»: los celulares no pueden usar este link. Para probar con celulares,
            abrí el panel con la dirección de tu compu en la red (por ejemplo http://192.168.100.7:5173/panel). En la
            etapa 4, con la app publicada, esto ya no hace falta.
          </Aviso>
        )}
      </div>

      {grande && qr && <QRGrande qr={qr} link={link} evaluacion={evaluacion} onCerrar={() => setGrande(false)} />}
    </div>
  )
}

/** QR a pantalla completa, para proyectar en la capacitación. */
function QRGrande({
  qr,
  link,
  evaluacion,
  onCerrar,
}: {
  qr: string
  link: string
  evaluacion: EvaluacionFila
  onCerrar: () => void
}) {
  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar()
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [onCerrar])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Código QR en pantalla grande"
      className="fixed inset-0 z-30 flex overflow-auto bg-white p-6 text-center"
      onClick={onCerrar}
    >
      {/* m-auto centra sin cortar el contenido cuando la ventana es baja */}
      <div className="m-auto flex flex-col items-center gap-4">
        <LogoMarca marca={evaluacion.marca} decorativo />
        <h2 className="font-titulo text-[clamp(24px,4vw,44px)] font-bold leading-tight">{evaluacion.titulo}</h2>
        <img src={qr} alt={`Código QR de ${link}`} className="aspect-square w-[min(62vh,85vw)]" />
        <p className="font-mono text-[clamp(16px,2.2vw,26px)] font-semibold break-all">{link}</p>
        <p className="text-texto-2">Escaneá con la cámara del celular · tocá en cualquier lugar para cerrar</p>
      </div>
    </div>
  )
}
