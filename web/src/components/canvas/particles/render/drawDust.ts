// Renderizado del polvo de pigmento suspendido.
//
// Responsabilidad única: (contexto, motas de polvo) → píxeles.
// Es la capa más simple visualmente — puntos suaves sin técnica
// de pincel, ya que representan partículas microscópicas de pigmento,
// no trazos de un instrumento.

import {Ctx2D,rgba} from '../../pictoric';
import {DustParticle} from '../simulation';

//Dibuja todas las motas de polvo activas
export function drawDust(
    ctx: Ctx2D,
    dust: DustParticle[]
): void{
    for (const d of dust){
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
        ctx.fillStyle = rgba(d.color, d.life * 0.35);
        ctx.fill();
    }
}