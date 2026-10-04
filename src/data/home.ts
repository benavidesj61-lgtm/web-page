import type { IconName } from '@/components/ui/Icon.astro';
import type { AccordionItem } from '@/components/ui/Accordion.astro';

export interface Benefit {
  icon: IconName;
  title: string;
  description: string;
}

export const BENEFITS: readonly Benefit[] = [
  {
    icon: 'badge-check',
    title: 'Autenticidad garantizada',
    description:
      'Trabajamos solo con distribuidores autorizados. Cada frasco llega sellado de fábrica y con comprobante de compra.',
  },
  {
    icon: 'sparkles',
    title: 'Decants con trazabilidad',
    description:
      'Extraemos cada decant del frasco original, con atomizadores de vidrio nuevos y etiqueta con lote y fecha.',
  },
  {
    icon: 'building',
    title: 'Programa corporativo',
    description:
      'Sets personalizados con su logotipo, comprobante de crédito fiscal y precios por volumen desde 10 unidades.',
  },
  {
    icon: 'truck',
    title: 'Entrega en todo el país',
    description:
      'Entregas en el Gran San Salvador en 24 horas hábiles y envíos con seguimiento a todo El Salvador.',
  },
];

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
}

export const TESTIMONIALS: readonly Testimonial[] = [
  {
    quote:
      'Encargamos 40 sets ejecutivos para nuestros clientes de fin de año. Llegaron a tiempo, con tarjetas personalizadas y una presentación impecable. Ya tenemos el pedido del próximo año.',
    name: 'Andrea Martínez',
    role: 'Gerente de Mercadeo, sector financiero',
  },
  {
    quote:
      'Probé Baccarat Rouge con un decant de 10 ml antes de comprar el frasco. La asesoría por WhatsApp fue clara y sin presión. Se nota que conocen lo que venden.',
    name: 'Ricardo Hernández',
    role: 'Director comercial',
  },
  {
    quote:
      'Lo que más valoro es la confianza: los frascos llegan sellados y con factura. Para regalos de la empresa necesitamos un proveedor serio y LE SCENT lo es.',
    name: 'Gabriela Flores',
    role: 'Jefa de Talento Humano, empresa de logística',
  },
];

export const FAQS: readonly AccordionItem[] = [
  {
    question: '¿Los perfumes son 100 % originales?',
    answer:
      'Sí. Todos nuestros perfumes provienen de distribuidores autorizados y se entregan sellados de fábrica, con su caja original y comprobante de compra. Si tiene cualquier duda sobre un producto, con gusto le enviamos fotos del lote antes de su compra.',
  },
  {
    question: '¿Qué es un decant y por qué conviene comprarlo?',
    answer:
      'Un decant es una porción de 5 o 10 ml de un perfume original, trasvasada a un atomizador de vidrio nuevo. Es la forma más inteligente de probar una fragancia de lujo durante varias semanas antes de invertir en el frasco completo, o de llevar su perfume favorito de viaje.',
  },
  {
    question: '¿Atienden pedidos corporativos y emiten crédito fiscal?',
    answer:
      'Sí. Preparamos regalos para clientes y colaboradores desde 10 unidades, con tarjeta personalizada, logotipo de su empresa y entrega coordinada. Emitimos factura de consumidor final o comprobante de crédito fiscal según lo necesite.',
  },
  {
    question: '¿Cómo hago un pedido?',
    answer:
      'Elija el producto en el catálogo y presione "Consultar por WhatsApp". El mensaje se envía con el nombre del producto y le confirmamos disponibilidad, precio final y tiempo de entrega en minutos durante nuestro horario de atención.',
  },
  {
    question: '¿Qué formas de pago aceptan?',
    answer:
      'Aceptamos transferencia bancaria, pago con tarjeta de crédito o débito mediante enlace de pago seguro y efectivo contra entrega en el Gran San Salvador. Para empresas también ofrecemos pago contra factura previa aprobación.',
  },
  {
    question: '¿Hacen envíos a todo El Salvador?',
    answer:
      'Sí. En el Gran San Salvador entregamos en 24 horas hábiles. Para el resto del país enviamos con empresa de mensajería y número de seguimiento, con un tiempo estimado de 1 a 3 días hábiles.',
  },
];
