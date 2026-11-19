import type { Metadata } from 'next'
import { PaginaCuenta } from '@/components/cuenta/pagina-cuenta'

export const metadata: Metadata = { title: 'Mi cuenta' }

export default function CuentaPage() {
  return <PaginaCuenta modulo="admin" />
}
