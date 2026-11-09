/**
 * La dirección de una unidad. El apartamento 402 solo existe con su torre,
 * así que ambas viajan juntas y se leen igual en todos los módulos.
 * La torre llega como texto porque el backend puede nombrarla con cualquier letra.
 */
export function Plate({ torre, apto }: { torre: string; apto: number }) {
  return (
    <span className="plate">
      <span className="sr-only">
        Torre {torre}, apartamento {apto}
      </span>
      <span className="plate-torre" aria-hidden="true">
        {torre}
      </span>
      <span className="plate-apto" aria-hidden="true">
        {apto}
      </span>
    </span>
  )
}
