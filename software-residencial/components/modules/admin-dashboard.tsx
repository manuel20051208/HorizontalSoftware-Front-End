'use client'

import { useState } from 'react'
import { Bell, Megaphone, Plus, Receipt, Send, ShieldCheck, Users, WalletCards } from 'lucide-react'

const notices = [
  { title: 'Mantenimiento ascensor Torre B', audience: 'Todos los residentes', date: 'Hoy, 9:42 a. m.', status: 'Publicado' },
  { title: 'Reunión ordinaria de copropietarios', audience: 'Propietarios', date: 'Ayer, 4:10 p. m.', status: 'Programado' },
  { title: 'Cierre temporal de piscina', audience: 'Todos los residentes', date: '3 nov, 11:20 a. m.', status: 'Publicado' },
]

const payments = [
  { name: 'Laura Méndez', unit: 'Apto 402 · Torre A', amount: '$ 485.000', status: 'Confirmado' },
  { name: 'Carlos Rojas', unit: 'Apto 803 · Torre B', amount: '$ 485.000', status: 'Confirmado' },
  { name: 'Ana Torres', unit: 'Apto 201 · Torre A', amount: '$ 485.000', status: 'Pendiente' },
  { name: 'Julián Castro', unit: 'Apto 504 · Torre C', amount: '$ 485.000', status: 'Confirmado' },
]

export function AdminDashboard() {
  const [activeQuickAction, setActiveQuickAction] = useState('')
  return (
    <div className="admin-page">
      <section className="page-heading admin-heading">
        <div><div className="breadcrumb">Torres del Parque <span>/</span> Administración</div><h1>Panel administrativo</h1><p>Controla la operación completa de tu inmueble desde un solo lugar.</p></div>
        <div className="heading-actions"><button className="icon-button notification"><Bell /><i /></button><span className="admin-status"><span /> Inmueble activo</span></div>
      </section>

      <section className="quick-actions card">
        <div className="quick-actions-title"><span className="eyebrow">Acciones rápidas</span><p>Lo más usado por tu equipo</p></div>
        <div className="quick-action-list">
          {[
            { label: 'Nuevo comunicado', icon: Megaphone, tone: 'quick-purple' },
            { label: 'Autorizar usuario', icon: Users, tone: 'quick-blue' },
            { label: 'Registrar pago', icon: Receipt, tone: 'quick-green' },
            { label: 'Invitar vigilante', icon: ShieldCheck, tone: 'quick-amber' },
          ].map(({ label, icon: Icon, tone }) => <button key={label} className="quick-action" onClick={() => setActiveQuickAction(label)}><span className={tone}><Icon /></span><span>{label}</span><Plus /></button>)}
        </div>
        {activeQuickAction && <div className="quick-feedback"><Send /> Acción lista para conectar con tu backend: <strong>{activeQuickAction}</strong></div>}
      </section>

      <section className="stats-grid admin-stats">
        <div className="stat-card tone-purple"><div className="stat-icon"><WalletCards /></div><span>Recaudo del mes</span><strong>$ 18.4M</strong><small><b>+12.8%</b> frente al mes anterior</small></div>
        <div className="stat-card tone-rose"><div className="stat-icon"><Receipt /></div><span>Pagos recibidos</span><strong>186</strong><small>de 198 apartamentos</small></div>
        <div className="stat-card tone-blue"><div className="stat-icon"><Users /></div><span>Por autorizar</span><strong>12</strong><small>usuarios pendientes</small></div>
        <div className="stat-card tone-green"><div className="stat-icon"><Megaphone /></div><span>Comunicados activos</span><strong>8</strong><small>3 programados esta semana</small></div>
      </section>

      <section className="admin-columns">
        <div className="card admin-list-card"><div className="card-header"><div><h2>Comunicados recientes</h2><p>Mensajes enviados a la comunidad</p></div><button className="text-button">Ver todos <Send /></button></div><div className="admin-list">{notices.map((notice) => <div className="admin-list-row" key={notice.title}><span className="list-avatar notice-avatar"><Megaphone /></span><div><strong>{notice.title}</strong><small>{notice.audience} · {notice.date}</small></div><span className={`badge ${notice.status === 'Publicado' ? 'badge-green' : 'badge-yellow'}`}>{notice.status}</span></div>)}</div></div>
        <div className="card admin-list-card"><div className="card-header"><div><h2>Últimos pagos</h2><p>Movimientos recibidos por Wompi</p></div><button className="wompi-pill">wompi</button></div><div className="admin-list">{payments.map((payment) => <div className="admin-list-row" key={payment.name}><span className="list-avatar payment-avatar"><WalletCards /></span><div><strong>{payment.name}</strong><small>{payment.unit} · {payment.amount}</small></div><span className={`badge ${payment.status === 'Confirmado' ? 'badge-green' : 'badge-yellow'}`}>{payment.status}</span></div>)}</div></div>
      </section>
    </div>
  )
}
