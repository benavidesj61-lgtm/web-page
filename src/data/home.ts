import type { AccordionItem } from '@/components/ui/Accordion.astro';
import type { IconName } from '@/components/ui/Icon.astro';
import { CONTACT, SITE } from './site';

export interface Benefit {
  icon: IconName;
  title: string;
  description: string;
}

export const BENEFITS: readonly Benefit[] = [
  {
    icon: 'shield',
    title: 'Originalidad garantizada',
    description:
      'Trabajamos solo con frascos 100 % originales y sellados. Cada decant se extrae de un frasco auténtico, con atomizadores nuevos.',
  },
  {
    icon: 'droplet',
    title: 'Decants para probar sin riesgo',
    description:
      'Presentaciones de 3, 5 y 10 ml para conocer cómo evoluciona una fragancia en su piel antes de invertir en el frasco completo.',
  },
  {
    icon: 'briefcase',
    title: 'Atención para empresas',
    description:
      'Cotizaciones por volumen para clientes, colaboradores y eventos, con un asesor que acompaña su pedido de principio a fin.',
  },
  {
    icon: 'gift',
    title: 'Regalos listos para entregar',
    description:
      'Sets en estuche negro con tarjeta personalizada: un detalle elegante que refleja la imagen de su empresa.',
  },
  {
    icon: 'truck',
    title: 'Entregas en El Salvador',
    description:
      'Coordinamos la entrega de su pedido en el lugar que nos indique; el costo y el plazo se confirman en la cotización.',
  },
  {
    icon: 'clock',
    title: 'Respuesta ágil',
    description: `Respondemos cada solicitud en un plazo máximo de ${SITE.responseTime}, de lunes a viernes de 8:00 a. m. a 5:00 p. m.`,
  },
];

export const FAQ_ITEMS: readonly AccordionItem[] = [
  {
    question: '¿Los perfumes son originales?',
    answer:
      'Sí. Todos nuestros frascos son 100 % originales y se entregan sellados. Los decants se extraen de esos mismos frascos originales, por lo que usted recibe exactamente la misma fragancia.',
  },
  {
    question: '¿Qué es un decant y por qué conviene?',
    answer:
      'Un decant es una porción de 3, 5 o 10 ml de un perfume original, envasada en un atomizador de vidrio. Es ideal para probar una fragancia durante varios días, llevarla de viaje o regalar varias opciones sin el costo de un frasco completo.',
  },
  {
    question: '¿Cómo solicito una cotización para mi empresa?',
    answer:
      'Complete el formulario de contacto indicando el producto de interés, la cantidad aproximada y la fecha en que lo necesita. Un asesor le enviará una cotización detallada en un plazo máximo de un día hábil.',
  },
  {
    question: '¿Pueden personalizar los regalos corporativos?',
    answer:
      'Sí. Nuestros sets incluyen tarjeta con mensaje personalizado y podemos armar combinaciones de fragancias según el perfil de quienes recibirán el regalo. Cuéntenos su idea en el formulario.',
  },
  {
    question: '¿Hacen entregas a domicilio?',
    answer:
      'Coordinamos la entrega en la dirección que nos indique dentro de El Salvador. El costo y el tiempo de entrega dependen de la zona y del tamaño del pedido, y se confirman en su cotización.',
  },
  {
    question: '¿Cómo puedo comunicarme con ustedes?',
    answer: `Puede escribirnos mediante el formulario de contacto, llamarnos al ${CONTACT.phone.display} o enviarnos un correo a ${CONTACT.email}. Atendemos de lunes a viernes de 8:00 a. m. a 5:00 p. m.`,
  },
];
