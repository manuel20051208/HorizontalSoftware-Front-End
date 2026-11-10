'use client'

import {
  Bell,
  Building2,
  CalendarDays,
  Car,
  ChevronDown,
  ClipboardList,
  FileText,
  Home,
  HousePlus,
  Megaphone,
  Receipt,
  UserPlus,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import styles from './menu-modulos.module.css'

type Opcion = { texto: string; nota: string; icono: LucideIcon; href: string }
type Grupo = { titulo: string; opciones: Opcion[] }
type Menu = { inicio: string; grupos: Grupo[] }

/** Cada columna del menú agrupa las pantallas de un mismo asunto. */
const MENUS: Record<'admin' | 'residente', Menu> = {
  admin: {
    inicio: '/admin',
    grupos: [
      {
        titulo: 'Pagos',
        opciones: [
          { texto: 'Liquidaciones', nota: 'Genera y ajusta el cobro del periodo', icono: FileText, href: '/admin/liquidaciones' },
          { texto: 'Pagos recibidos', nota: 'Movimientos, anulaciones y reembolsos', icono: Wallet, href: '/admin/pagos' },
          { texto: 'Conciliar pago', nota: 'Registra un pago desde el inmueble', icono: Receipt, href: '/admin/inmuebles' },
        ],
      },
      {
        titulo: 'Crear',
        opciones: [
          { texto: 'Crear cuenta', nota: 'Residente, vigilante o administrador', icono: UserPlus, href: '/admin/usuarios/nueva' },
          { texto: 'Nuevo inmueble', nota: 'Registra un apartamento', icono: HousePlus, href: '/admin/inmuebles/nuevo' },
          { texto: 'Nuevo comunicado', nota: 'Envía un aviso al conjunto', icono: Megaphone, href: '/admin/notificaciones' },
        ],
      },
      {
        titulo: 'Convivencia',
        opciones: [
          { texto: 'Zonas comunes', nota: 'Salón, BBQ, canchas y más', icono: ClipboardList, href: '/admin/zonas-comunes' },
          { texto: 'Reglas de reserva', nota: 'Horarios y condiciones de uso', icono: CalendarDays, href: '/admin/reglas-reserva' },
          { texto: 'Comunicados', nota: 'Avisos enviados y recibidos', icono: Bell, href: '/admin/notificaciones' },
        ],
      },
      {
        titulo: 'Conjunto',
        opciones: [
          { texto: 'Usuarios', nota: 'Cuentas y su estado', icono: Users, href: '/admin/usuarios' },
          { texto: 'Inmuebles', nota: 'Apartamentos y su cartera', icono: Building2, href: '/admin/inmuebles' },
        ],
      },
    ],
  },
  residente: {
    inicio: '/residente',
    grupos: [
      {
        titulo: 'Pagos',
        opciones: [
          { texto: 'Pagar mi administración', nota: 'Saldo, pago en línea e historial', icono: FileText, href: '/residente/pagos' },
        ],
      },
      {
        titulo: 'Convivencia',
        opciones: [
          { texto: 'Reservar una zona común', nota: 'Elige zona y horario', icono: CalendarDays, href: '/residente/reservas' },
          { texto: 'Invitar un visitante', nota: 'Autoriza su entrada en portería', icono: UserPlus, href: '/residente/invitados' },
          { texto: 'Avisos', nota: 'Comunicados de la administración', icono: Bell, href: '/residente/notificaciones' },
        ],
      },
      {
        titulo: 'Mi inmueble',
        opciones: [
          { texto: 'Mi auto y parqueadero', nota: 'Placa y parqueadero asignado', icono: Car, href: '/residente/auto' },
        ],
      },
    ],
  },
}

/**
 * Menú horizontal del módulo. Con mouse, cada columna se abre al pasar el cursor;
 * en el teléfono (o con teclado) se abre y se cierra al tocarla.
 */
export function MenuModulos({ modulo }: { modulo: 'admin' | 'residente' }) {
  const { inicio, grupos } = MENUS[modulo]
  const ruta = usePathname()
  const [abierto, setAbierto] = useState<number | null>(null)
  const nav = useRef<HTMLElement>(null)
  // Si el cursor ya la abrió, el clic no debe cerrarla de inmediato
  const abiertoPorCursor = useRef(false)

  // Al cambiar de pantalla, el menú se recoge
  useEffect(() => setAbierto(null), [ruta])

  useEffect(() => {
    if (abierto === null) return
    const fuera = (e: PointerEvent) => {
      if (!nav.current?.contains(e.target as Node)) setAbierto(null)
    }
    const escape = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setAbierto(null)
      nav.current?.querySelector<HTMLElement>(`[data-grupo="${abierto}"]`)?.focus()
    }
    document.addEventListener('pointerdown', fuera)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', fuera)
      document.removeEventListener('keydown', escape)
    }
  }, [abierto])

  const activa = (href: string) => ruta === href || ruta.startsWith(`${href}/`)

  return (
    <nav
      ref={nav}
      className={styles.menu}
      aria-label="Módulos"
      onPointerLeave={(e) => {
        if (e.pointerType === 'mouse') setAbierto(null)
      }}
    >
      <ul className={`contenedor ${styles.fila}`}>
        <li>
          <Link
            href={inicio}
            className={styles.pestana}
            aria-current={ruta === inicio ? 'page' : undefined}
            onPointerEnter={(e) => {
              if (e.pointerType === 'mouse') setAbierto(null)
            }}
          >
            <Home aria-hidden="true" />
            <span className={styles.inicioTexto}>Inicio</span>
          </Link>
        </li>

        {grupos.map((grupo, i) => {
          const estaAbierto = abierto === i
          const contieneRuta = grupo.opciones.some((o) => activa(o.href))
          return (
            <li key={grupo.titulo} className={styles.grupo}>
              <button
                type="button"
                className={styles.pestana}
                data-grupo={i}
                data-actual={contieneRuta || undefined}
                aria-expanded={estaAbierto}
                aria-controls={`menu-${modulo}-${i}`}
                onPointerEnter={(e) => {
                  if (e.pointerType !== 'mouse') return
                  abiertoPorCursor.current = true
                  setAbierto(i)
                }}
                onClick={() => {
                  if (abiertoPorCursor.current && estaAbierto) {
                    abiertoPorCursor.current = false
                    return
                  }
                  setAbierto(estaAbierto ? null : i)
                }}
              >
                {grupo.titulo}
                <ChevronDown aria-hidden="true" className={styles.flecha} />
              </button>

              <ul id={`menu-${modulo}-${i}`} className={styles.panel} hidden={!estaAbierto}>
                {grupo.opciones.map(({ texto, nota, icono: Icono, href }) => (
                  <li key={texto}>
                    <Link
                      href={href}
                      className={styles.opcion}
                      aria-current={ruta === href ? 'page' : undefined}
                      onClick={() => setAbierto(null)}
                    >
                      <Icono aria-hidden="true" />
                      <span>
                        <strong>{texto}</strong>
                        <small>{nota}</small>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
