'use client'

import { useState } from 'react'
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  CreditCard,
  DoorOpen,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  UserCheck,
  UserRound,
  Users,
  WalletCards,
  X,
} from 'lucide-react'

type Role = 'Administrador' | 'Residente' | 'Vigilante'

const roles: { label: Role; icon: typeof ShieldCheck; color: string }[] = [
  { label: 'Administrador', icon: ShieldCheck, color: 'bg-indigo-100 text-indigo-700' },
  { label: 'Residente', icon: UserRound, color: 'bg-emerald-100 text-emerald-700' },
  { label: 'Vigilante', icon: UserCheck, color: 'bg-amber-100 text-amber-700' },
]

const navItems = [
  { label: 'Resumen', icon: LayoutDashboard },
  { label: 'Pagos', icon: CircleDollarSign, badge: '12' },
  { label: 'Reservas', icon: CalendarDays },
  { label: 'Residentes', icon: Users, badge: '3' },
  { label: 'Accesos', icon: DoorOpen },
]

const activities = [
  { title: 'Pago recibido', detail: 'Apto 402 · Administración octubre', amount: '+ $ 485.000', time: 'Hace 8 min', type: 'positive' },
  { title: 'Nueva reserva', detail: 'Salón social · Apto 807', amount: 'Hoy, 6:00 PM', time: 'Hace 24 min', type: 'neutral' },
  { title: 'Invitado autorizado', detail: 'Mariana López · Apto 302', amount: 'Acceso temporal', time: 'Hace 42 min', type: 'neutral' },
  { title: 'Pago pendiente', detail: 'Apto 109 · Administración octubre', amount: '$ 485.000', time: 'Hace 1 h', type: 'warning' },
]

function Sidebar({ role, onRoleChange, open }: { role: Role; onRoleChange: (role: Role) => void; open: boolean }) {
  return (
    <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
      <div className="brand">
        <div className="brand-mark"><Building2 /></div>
        <span>habita<span className="brand-dot">.</span></span>
      </div>
      <div className="property-select">
        <div className="property-icon"><Building2 /></div>
        <div><span className="eyebrow">Inmueble activo</span><strong>Torres del Parque</strong></div>
        <ChevronDown className="select-chevron" />
      </div>
      <div className="nav-label">Módulo {role}</div>
      <nav className="main-nav">
        {navItems.map((item, index) => {
          const Icon = item.icon
          return <button className={`nav-item ${index === 0 ? 'nav-active' : ''}`} key={item.label}><Icon /><span>{item.label}</span>{item.badge && <b>{item.badge}</b>}</button>
        })}
      </nav>
      <div className="nav-label secondary-label">Configuración</div>
      <nav className="main-nav">
        <button className="nav-item"><FileText /><span>Comunicados</span></button>
        <button className="nav-item"><Settings /><span>Configuración</span></button>
      </nav>
      <div className="sidebar-bottom">
        <div className="role-switcher"><span className="eyebrow">Ver como</span><select value={role} onChange={(e) => onRoleChange(e.target.value as Role)}>{roles.map((r) => <option key={r.label}>{r.label}</option>)}</select></div>
        <div className="profile"><div className="avatar avatar-indigo">SM</div><div><strong>Santiago Méndez</strong><span>Administrador</span></div><MoreHorizontal /></div>
      </div>
    </aside>
  )
}

function StatCard({ title, value, sub, icon: Icon, tone, trend }: { title: string; value: string; sub: string; icon: typeof Users; tone: string; trend?: string }) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}><Icon /></div><div className="stat-copy"><span>{title}</span><strong>{value}</strong><small className={trend?.startsWith('+') ? 'trend-up' : ''}>{trend && <ArrowUpRight />} {sub}</small></div></div>
}

export function AdminDashboard() {
  const [period, setPeriod] = useState('Este mes')
  return <>
    <section className="page-heading"><div><div className="breadcrumb">Torres del Parque <span>/</span> Resumen</div><h1>Buenos días, Santiago <span className="wave">✦</span></h1><p>Esto es lo que está pasando en tu inmueble hoy.</p></div><div className="heading-actions"><button className="icon-button notification"><Bell /><i /></button><button className="primary-button"><Plus /> Nuevo comunicado</button></div></section>
    <section className="stats-grid">
      <StatCard title="Recaudo del mes" value="$ 18.4M" sub="12.8% vs. mes anterior" trend="+12.8%" icon={WalletCards} tone="tone-purple" />
      <StatCard title="Pagos pendientes" value="12" sub="3 vencidos" icon={Clock3} tone="tone-rose" />
      <StatCard title="Reservas activas" value="24" sub="8 esta semana" icon={CalendarDays} tone="tone-blue" />
      <StatCard title="Ocupación" value="87%" sub="4.2% vs. mes anterior" trend="+4.2%" icon={Users} tone="tone-green" />
    </section>
    <section className="dashboard-grid">
      <div className="card chart-card"><div className="card-header"><div><h2>Recaudo mensual</h2><p>Ingresos por administración y otros conceptos</p></div><select className="period-select" value={period} onChange={(e) => setPeriod(e.target.value)}><option>Este mes</option><option>Últimos 6 meses</option><option>Este año</option></select></div><div className="chart-legend"><span><i className="legend-dot purple-dot" />Recaudo</span><span><i className="legend-dot gray-dot" />Meta mensual</span></div><div className="chart"><div className="y-axis"><span>$20M</span><span>$15M</span><span>$10M</span><span>$5M</span><span>$0</span></div><div className="chart-area"><div className="grid-lines"><i /><i /><i /><i /><i /></div><svg viewBox="0 0 650 185" preserveAspectRatio="none" className="chart-svg" aria-label="Gráfica de recaudo mensual"><defs><linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#7769e8" stopOpacity=".28" /><stop offset="100%" stopColor="#7769e8" stopOpacity="0" /></linearGradient></defs><path d="M0 144 C35 135 44 120 82 123 S135 108 166 110 S208 91 244 99 S294 68 329 77 S365 54 405 64 S448 48 486 54 S530 25 571 35 S625 22 650 18 L650 185 L0 185Z" fill="url(#chartFill)" /><path d="M0 144 C35 135 44 120 82 123 S135 108 166 110 S208 91 244 99 S294 68 329 77 S365 54 405 64 S448 48 486 54 S530 25 571 35 S625 22 650 18" fill="none" stroke="#7568e8" strokeWidth="3" strokeLinecap="round" /><circle cx="571" cy="35" r="5" fill="white" stroke="#7568e8" strokeWidth="3" /></svg><div className="x-axis"><span>Abr</span><span>May</span><span>Jun</span><span>Jul</span><span>Ago</span><span>Sep</span><span>Oct</span></div></div></div></div>
      <div className="card collection-card"><div className="card-header"><div><h2>Estado de cartera</h2><p>Distribución de pagos</p></div><button className="more-button"><MoreHorizontal /></button></div><div className="donut-wrap"><div className="donut"><div><strong>82%</strong><span>al día</span></div></div><div className="donut-legend"><div><i className="green-dot" /><span>Al día</span><b>82%</b></div><div><i className="yellow-dot" /><span>Por vencer</span><b>11%</b></div><div><i className="red-dot" /><span>Vencida</span><b>7%</b></div></div></div><button className="text-button">Ver detalle de cartera <ArrowUpRight /></button></div>
    </section>
    <section className="bottom-grid"><div className="card activity-card"><div className="card-header"><div><h2>Actividad reciente</h2><p>Últimos movimientos del inmueble</p></div><button className="text-button">Ver todo <ArrowUpRight /></button></div><div className="activity-list">{activities.map((item) => <div className="activity-row" key={item.title + item.detail}><div className={`activity-icon activity-${item.type}`}>{item.type === 'positive' ? <Check /> : item.type === 'warning' ? <AlertCircle /> : <CalendarDays />}</div><div className="activity-info"><strong>{item.title}</strong><span>{item.detail}</span></div><div className={`activity-value ${item.type}`}>{item.amount}</div><time>{item.time}</time></div>)}</div></div><div className="card quick-card"><div className="card-header"><div><h2>Acciones rápidas</h2><p>Gestiona tu inmueble</p></div></div><div className="quick-actions"><button><div className="quick-icon quick-purple"><UserRound /></div><span>Crear usuario</span><ArrowUpRight /></button><button><div className="quick-icon quick-blue"><CalendarDays /></div><span>Aprobar reserva</span><ArrowUpRight /></button><button><div className="quick-icon quick-orange"><Bell /></div><span>Enviar comunicado</span><ArrowUpRight /></button></div></div></section>
  </>
}

export function ResidentDashboard() {
  return <><section className="page-heading"><div><div className="breadcrumb">Torres del Parque <span>/</span> Resumen</div><h1>Hola, Santiago <span className="wave">✦</span></h1><p>Todo lo que necesitas para vivir mejor en tu conjunto.</p></div><div className="heading-actions"><button className="icon-button notification"><Bell /><i /></button><button className="primary-button"><Plus /> Nueva invitación</button></div></section><section className="resident-hero"><div><span className="eyebrow">Próximo pago</span><h2>Administración de noviembre</h2><strong>$ 485.000 <small>hasta el 10 de noviembre</small></strong><button className="pay-button"><CreditCard /> Pagar administración <span className="wompi-chip">Wompi</span></button></div><div className="hero-illustration"><Building2 /></div></section><section className="stats-grid resident-stats"><StatCard title="Mis invitados" value="4" sub="2 activos hoy" icon={Users} tone="tone-purple" /><StatCard title="Próxima reserva" value="Salón social" sub="Sáb, 16 nov · 4:00 PM" icon={CalendarDays} tone="tone-blue" /><StatCard title="Estado de cuenta" value="Al día" sub="Último pago · 10 oct" icon={CircleDollarSign} tone="tone-green" /></section><section className="bottom-grid"><div className="card activity-card"><div className="card-header"><div><h2>Mis próximas actividades</h2><p>Reservas e invitaciones activas</p></div><button className="text-button">Ver todo <ArrowUpRight /></button></div><div className="activity-list"><div className="activity-row"><div className="activity-icon activity-neutral"><CalendarDays /></div><div className="activity-info"><strong>Salón social</strong><span>Sábado 16 nov · 4:00 PM - 8:00 PM</span></div><Badge text="Confirmada" variant="green" /></div><div className="activity-row"><div className="activity-icon activity-neutral"><UserCheck /></div><div className="activity-info"><strong>Mariana López</strong><span>Invitación · Hoy hasta las 11:00 PM</span></div><Badge text="Activa" variant="purple" /></div><div className="activity-row"><div className="activity-icon activity-neutral"><UserCheck /></div><div className="activity-info"><strong>Andrés Rojas</strong><span>Autorización permanente</span></div><Badge text="Permanente" variant="gray" /></div></div></div><div className="card quick-card"><div className="card-header"><div><h2>Accesos rápidos</h2><p>Gestiona tu hogar</p></div></div><div className="quick-actions"><button><div className="quick-icon quick-purple"><UserRound /></div><span>Invitar visitante</span><ArrowUpRight /></button><button><div className="quick-icon quick-blue"><CalendarDays /></div><span>Reservar zona común</span><ArrowUpRight /></button><button><div className="quick-icon quick-orange"><FileText /></div><span>Ver mis recibos</span><ArrowUpRight /></button></div></div></section></>
}

export function SecurityDashboard() {
  return <><section className="page-heading"><div><div className="breadcrumb">Torres del Parque <span>/</span> Control de acceso</div><h1>Turno de vigilancia <span className="wave">✦</span></h1><p>Martes, 5 de noviembre de 2026 · Turno mañana</p></div><div className="heading-actions"><button className="icon-button notification"><Bell /><i /></button><button className="shift-button"><span className="live-dot" /> Turno activo</button></div></section><section className="security-stats"><StatCard title="Personas dentro" value="38" sub="12 visitantes · 26 residentes" icon={Users} tone="tone-purple" /><StatCard title="Ingresos hoy" value="84" sub="+16% vs. martes anterior" trend="+16%" icon={ArrowUpRight} tone="tone-green" /><StatCard title="Reservas hoy" value="6" sub="2 en curso ahora" icon={CalendarDays} tone="tone-blue" /></section><section className="security-grid"><div className="card access-card"><div className="card-header"><div><h2>Control de accesos</h2><p>Actividad en tiempo real</p></div><div className="live-pill"><span className="live-dot" /> En vivo</div></div><div className="access-list"><div className="access-row"><div className="avatar avatar-green">ML</div><div className="activity-info"><strong>Mariana López</strong><span>Visitante · Apto 302</span></div><Badge text="Autorizada" variant="green" /><time>10:42 AM</time></div><div className="access-row"><div className="avatar avatar-blue">DR</div><div className="activity-info"><strong>Diego Ramírez</strong><span>Residente · Apto 504</span></div><Badge text="Ingreso" variant="purple" /><time>10:36 AM</time></div><div className="access-row"><div className="avatar avatar-orange">JG</div><div className="activity-info"><strong>Jorge Gómez</strong><span>Proveedor · Mantenimiento</span></div><Badge text="Temporal" variant="yellow" /><time>10:21 AM</time></div><div className="access-row"><div className="avatar avatar-gray">AS</div><div className="activity-info"><strong>Ana Salazar</strong><span>Visitante · Apto 801</span></div><Badge text="Salida" variant="gray" /><time>10:08 AM</time></div></div><button className="full-button">Ver historial de accesos <ArrowUpRight /></button></div><div className="card reservations-card"><div className="card-header"><div><h2>Reservas de hoy</h2><p>Uso de zonas comunes</p></div><button className="more-button"><MoreHorizontal /></button></div><div className="reservation-list"><div><div className="reservation-time">11:00 <span>AM</span></div><div className="reservation-line" /><div><strong>Gimnasio</strong><span>Apto 204 · Carlos Ruiz</span></div><Badge text="En curso" variant="green" /></div><div><div className="reservation-time">2:00 <span>PM</span></div><div className="reservation-line" /><div><strong>Salón social</strong><span>Apto 807 · Laura Torres</span></div><Badge text="Próxima" variant="purple" /></div><div><div className="reservation-time">6:00 <span>PM</span></div><div className="reservation-line" /><div><strong>BBQ</strong><span>Apto 601 · Felipe Mora</span></div><Badge text="Próxima" variant="purple" /></div></div></div></section></>
}

function Badge({ text, variant }: { text: string; variant: string }) { return <span className={`badge badge-${variant}`}>{text}</span> }

const loginRoles = [
  { label: 'Administrador', description: 'Gestiona usuarios, pagos y reservas', href: '/admin', icon: ShieldCheck, color: 'bg-indigo-100 text-indigo-700' },
  { label: 'Residente', description: 'Invita personas, reserva y paga', href: '/residente', icon: UserRound, color: 'bg-emerald-100 text-emerald-700' },
  { label: 'Vigilante', description: 'Controla accesos y novedades', href: '/vigilante', icon: UserCheck, color: 'bg-amber-100 text-amber-700' },
]

export default function Page() {
  return <main className="login-shell"><div className="login-card"><div className="brand login-brand"><div className="brand-mark"><Building2 /></div><span>habita<span className="brand-dot">.</span></span></div><span className="eyebrow">Portal del inmueble</span><h1>Selecciona tu módulo</h1><p>Inicia sesión según el rol con el que gestionarás Torres del Parque.</p><div className="login-roles">{loginRoles.map(({ label, description, href, icon: Icon, color }) => <a className="login-role" href={href} key={label}><div className={`login-role-icon ${color}`}><Icon /></div><div><strong>{label}</strong><span>{description}</span></div><ArrowUpRight /></a>)}</div><small className="login-footnote">Acceso seguro para residentes y equipo del inmueble</small></div></main>
}
