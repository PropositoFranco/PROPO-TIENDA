/**
 * useMembershipStore.js
 * Gestión de membresía, módulos semanales y progreso del usuario.
 * Se integra con useAuthStore existente — sin duplicar estado.
 *
 * Flujo:
 *   1. Al login → loadMembership() valida suscripción desde Supabase
 *   2. Al entrar a un módulo → openModule(slug) lo marca como visto
 *   3. Guards usan selectores: isMember, hasAccessTo(slug)
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '../services/supabase';

// ─── Configuración de módulos ───────────────────────────────────────────────
// Todos los módulos existen aquí desde el principio.
// La membresía simplemente "desbloquea" el acceso — no sube contenido dinámico.
export const ACADEMY_MODULES = [
  {
    slug: 'vision-maestra-01',
    week: 1,
    protocolo: 'V1',
    title: 'Visual Board',
    subtitle: 'Define con claridad la vida que quieres construir',
    type: 'vision',
    duration: '25 min',
    xpReward: 50,
    gemReward: 40,
    coinReward: 40,
    locked: true,
    videoId: '5ef5c7ee-78c0-4025-a846-f1cef76352eb',
    evidenceCategory: 'Juramento Templario',
   evidencePrompt: '¿Cómo se ve en tu cabeza la vida que estás construyendo? Descríbela.',
    evidenceHint: 'No tienes que tenerlo todo claro. Escribe lo que sí ves — una imagen, una sensación, un detalle que te dice que vas en la dirección correcta.',
    context: {
      why: [
        'La mayoría no fracasa por falta de esfuerzo.',
        '',
        'Fracasa por falta de precisión.',
        '',
        'Trabajan. Se ocupan. Intentan avanzar.',
        '',
        '… pero pocas veces se detienen a definir con claridad cómo quieren que se vea la vida que están construyendo.',
      ],
      signals: [
        'Tienes ambición… pero tu visión aún es difusa',
        'Quieres más… pero no has definido exactamente qué significa ese "más"',
        'Sientes que avanzas, pero sin una imagen clara del destino',
        'Necesitas convertir deseos generales en dirección visual concreta',
      ],
      truth: 'No puedes construir con precisión algo que nunca has definido con claridad. Mientras más claro sea tu destino… más fácil será alinear decisiones.',
      objective: 'Diseñar con mayor claridad la vida que realmente quieres construir.',
      keyPhrase: 'Lo que no defines… suele quedarse en deseo. Lo que visualizas con claridad… empieza a convertirse en dirección.',
      reminder: 'Registra en tu Registro del Templario cada avance y reflexión. Tu libreta es tu archivo sagrado.',
    },
  },
  {
    slug: 'vision-maestra-02',
    week: 2,
    protocolo: 'V2',
    title: 'Micro-Metas Semanales',
    subtitle: 'Transforma visión en movimiento real',
    type: 'vision',
    duration: '30 min',
    xpReward: 50,
    gemReward: 40,
    coinReward: 40,
    evidenceCategory: 'Juramento Templario',
    evidencePrompt: 'Kobe decía que los campeonatos no se ganan en el juego final — se ganan en los martes sin público. ¿Cuál fue tu martes esta semana?',
    evidenceHint: 'Cuéntanos la meta que nadie vio, qué hiciste para cumplirla y qué te dice de ti que lo hayas hecho igual.',
    locked: true,
    videoId: '092cfe6c-01e2-4d77-9020-4bf4359d2f86',
    context: {
      why: [
        'Probablemente no estás aquí porque no quieras cambiar.',
        '',
        'El problema es otro.',
        '',
        'Quieres resultados grandes…',
        '',
        '… pero no siempre tienes un sistema claro para avanzar hacia ellos de forma constante.',
      ],
      signals: [
        'Tienes objetivos importantes… pero a veces no sabes por dónde empezar',
        'Te motivas… pero después pierdes ritmo',
        'Haces demasiado algunos días… y otros casi nada',
        'Te exiges grandes cambios… y eso mismo a veces termina frenándote',
        'Piensas más de lo que ejecutas',
      ],
      truth: 'La mayoría no falla porque sueñe poco. Falla porque convierte demasiado poco en acción constante. Cuando no existe una estructura simple de ejecución… las metas se quedan en intención.',
      objective: 'No intentar cambiar toda tu vida hoy. Tu objetivo es avanzar de forma clara, específica y sostenible.',
      keyPhrase: 'No necesitas hacer todo hoy. Necesitas empezar a cumplirte en pequeño… de verdad.',
      reminder: 'Registra cada micro-meta, cada avance y cada cumplimiento en tu Registro del Templario. Lo que se escribe se vuelve compromiso. Lo que se mide, mejora.',
    },
  },
  {
    slug: 'vision-maestra-03',
    week: 3,
    protocolo: 'V3',
    title: 'Micro-Metas Semanales',
    subtitle: 'Consolida tu momentum y sigue avanzando',
    type: 'vision',
    duration: '30 min',
    xpReward: 50,
    gemReward: 40,
    coinReward: 40,
    evidenceCategory: 'Juramento Templario',
   evidencePrompt: 'No nos cuentes el día que todo fluyó. Cuéntanos el día que no tenías ganas — y avanzaste de todas formas.',
    evidenceHint: 'Ese momento donde elegiste seguir aunque no querías es el que más revela. ¿Qué pasó por tu cabeza y qué decidiste?',
    locked: true,
    videoId: '092cfe6c-01e2-4d77-9020-4bf4359d2f86',
    context: {
      why: [
        'Ya diste el primer paso.',
        '',
        'Eso no es poco — es exactamente donde la mayoría se detiene.',
        '',
        'Ahora el trabajo es diferente.',
        '',
        '… no se trata de empezar. Se trata de no parar.',
      ],
      signals: [
        'Ya tienes claridad de hacia dónde vas — ahora necesitas ritmo',
        'Sientes el momentum… y quieres que no se detenga',
        'Empiezas a ver resultados pequeños — y eso te dice que vas bien',
        'Quieres convertir este avance en un sistema que dure',
        'Estás listo para comprometerte en serio con tus micro-metas',
      ],
      truth: 'El progreso no se construye en los días de inspiración. Se construye en los días donde decides seguir aunque no tengas ganas. Eso es lo que separa a quien llega… de quien casi llega.',
      objective: 'Consolidar el sistema de micro-metas que ya iniciaste. Convertir el avance en hábito real.',
      keyPhrase: 'No necesitas más motivación. Necesitas más consistencia… y ya probaste que puedes.',
      reminder: 'Registra cada cumplimiento en tu Registro del Templario. Lo que se mide, mejora. Lo que se celebra, se repite. 🧭',
    },
  },
  {
    slug: 'vision-maestra-04',
    week: 4,
    protocolo: 'V4',
    title: 'Declaración de Propósito Personal',
    subtitle: 'Fortalece el núcleo interno desde el que avanzas',
    type: 'vision',
    duration: '35 min',
    xpReward: 50,
    gemReward: 40,
    coinReward: 40,
    evidenceCategory: 'Juramento Templario',
    evidencePrompt: 'Hay una razón por la que no paras aunque nadie te esté mirando. ¿Cuál es la tuya?',
    evidenceHint: 'No busques la respuesta más inspiradora — busca la más honesta. Esa suele ser la que más pesa.',
    locked: true,
    videoId: '02f0abe9-32d6-4ad7-a6b0-a472eb44484f',
    context: {
      why: [
        'Puedes estar cumpliendo. Avanzando. Esforzándote.',
        '',
        'Y aun así…',
        '',
        '… sentir que algo no termina de encajar.',
        '',
        'No porque estés haciendo todo mal.',
        '',
        'Sino porque una cosa es moverte — y otra muy distinta es saber con claridad qué fuerza interna dirige ese movimiento.',
      ],
      signals: [
        'Haces mucho… pero no siempre con un sentido claro detrás',
        'Cuando hay ruido externo, te cuesta mantenerte alineado',
        'Quieres fortalecer tu identidad, no solo tu productividad',
        'Buscas una base interna más sólida para tomar decisiones',
        'Construyes una vida que se ve bien por fuera… pero no siempre se siente coherente por dentro',
      ],
      truth: 'No basta con avanzar. También importa desde qué verdad interna estás construyendo. Cuando no existe una dirección interna sólida… es más fácil perder enfoque, tomar decisiones desde presión externa y dispersarse entre demasiadas prioridades.',
      objective: 'Fortalecer tu norte. Desarrollar mayor claridad interna para que lo que construyas hacia afuera tenga más sentido, más coherencia y más dirección.',
      keyPhrase: 'Cuando fortaleces tu dirección interna… tus decisiones externas empiezan a tener más sentido.',
      reminder: 'Escribe tu declaración. No solo la pienses — plásmala en tu Registro del Templario y léela todos los días. Cuando tu propósito baja al papel, deja de ser una idea bonita y se convierte en dirección concreta. Tu libreta es tu ancla. Si tu norte está escrito, tu camino no se pierde. 🧭',
    },
  },
  {
    slug: 'vision-maestra-05',
    week: 5,
    protocolo: 'V5',
    title: 'Redefiniendo Metas',
    subtitle: 'Eleva el nivel de lo que estás construyendo',
    type: 'vision',
    duration: '30 min',
    xpReward: 50,
    gemReward: 40,
    coinReward: 40,
    evidenceCategory: 'Juramento Templario',
     evidencePrompt: 'A veces no es que fallaste — es que creciste y tus metas no crecieron contigo. ¿Cuál tuviste que soltar o elevar?',
    evidenceHint: 'Cuéntanos cuál era la meta, el momento exacto donde dejó de emocionarte y qué la reemplazó. Ese click importa.',
    locked: true,
    videoId: 'd9caf0c1-9b90-4c80-99c2-fbe8e24ec23a',
    context: {
      why: [
        'Llegar hasta aquí no significa que estés fallando.',
        '',
        'De hecho, muchas veces ocurre lo contrario.',
        '',
        'Ya avanzaste. Ya creciste. Ya lograste cosas que antes parecían difíciles.',
        '',
        '… pero hay un problema que pocas personas detectan a tiempo.',
        '',
        'Siguen persiguiendo metas que fueron creadas por una versión antigua de sí mismos.',
      ],
      signals: [
        'Cumples objetivos… pero algunos ya no te emocionan igual',
        'Logras cosas… pero no siempre sientes expansión real',
        'Te esfuerzas… pero bajo estándares que ya te quedan pequeños',
        'Sigues usando metas viejas… aunque tú ya cambiaste',
        'Avanzas… pero no necesariamente hacia tu siguiente nivel',
      ],
      truth: 'No siempre estás frenado por falta de disciplina. A veces estás frenado porque ya creciste… pero tus metas no. Y cuando eso pasa, puedes terminar operando por debajo de tu potencial real.',
      objective: 'No demostrar que puedes seguir ocupado. Tu objetivo es asegurar que tu enfoque actual siga alineado con tu expansión real.',
      keyPhrase: 'No siempre necesitas empezar de nuevo… A veces necesitas elevar el nivel de lo que estás construyendo.',
      reminder: 'Mantén tu Registro del Templario siempre a mano. Anota cada descubrimiento, ajuste y compromiso. Esta práctica te permitirá visualizar tu progreso y fortalecer tu disciplina. 🧭',
    },
  },
{
    slug: 'control-01',
    week: 6,
    protocolo: 'C1',
    title: 'Diario del Guerrero',
    subtitle: 'Entrena tu mundo interno para dirigir tu mundo externo',
    type: 'control',
    duration: '25 min',
    xpReward: 50,
    gemReward: 40,
    coinReward: 40,
    evidenceCategory: 'Reto del Iniciado',
    evidencePrompt: 'Esta semana hubo un momento donde reaccionaste — y después te quedaste pensando en esa reacción. ¿Cuál fue?',
    evidenceHint: 'No tiene que ser algo grande ni dramático. A veces los momentos más reveladores son los más cotidianos. Cuéntanos qué pasó y qué aprendiste de ti.',
    locked: true,
    videoId: '6f652c30-400d-4fa2-8bc6-59c3f5ef55e1',
    context: {
      why: [
        'No todas las batallas importantes ocurren afuera.',
        '',
        'Muchas veces…',
        '',
        'Los desafíos que más afectan tu vida no vienen de falta de capacidad.',
        '',
        'Vienen de cómo respondes a lo que pasa dentro de ti.',
        '',
        'Una emoción mal dirigida.',
        'Un impulso no observado.',
        'Una reacción automática.',
        '',
        '… puede cambiar decisiones, relaciones y resultados más de lo que parece.',
      ],
      signals: [
        'Reaccionas emocionalmente… y después te das cuenta de que pudiste manejarlo mejor',
        'Sabes lo correcto… pero en momentos de enojo o frustración actúas distinto',
        'A veces tus emociones toman el control antes de que tu lógica intervenga',
        'Repites patrones que después analizas… pero solo cuando ya ocurrieron',
        'No fallas por falta de capacidad… sino por impulso o reacción',
      ],
      truth: 'No siempre son las situaciones las que más afectan tu vida. Muchas veces es cómo las procesas. Cuando no desarrollas autoconciencia emocional… es más fácil actuar desde ira, frustración o miedo — en lugar de actuar desde claridad.',
      objective: 'Aprender a observarte con mayor precisión. No para juzgarte… sino para entenderte. Porque cuando identificas mejor lo que sientes, lo que piensas y cómo reaccionas… empiezas a transformar impulsos en aprendizaje. Y aprendizaje en control.',
      keyPhrase: 'Quien aprende a observar su mundo interno… empieza a reaccionar menos… y a dirigir más.',
      reminder: 'Plasma tus avances y reflexiones en tu Registro del Templario. No estás recorriendo el Templo al azar — cada paso responde a tu diagnóstico. Explorar es libertad. Seguir tu plan es poder. 🧭',
    },
  },
{
    slug: 'control-02',
    week: 7,
    protocolo: 'C2',
    title: 'Bloques de Maestría del Tiempo',
    subtitle: 'Deja de reaccionar. Empieza a gobernar tus horas.',
    type: 'control',
    duration: '25 min',
    xpReward: 50,
    gemReward: 40,
    coinReward: 40,
    evidenceCategory: 'Reto del Iniciado',
    evidencePrompt: 'Esta semana, entre todo lo urgente — ¿le diste tiempo real a lo que de verdad importa?',
    evidenceHint: 'Warren Buffett dice que la diferencia entre exitosos y muy exitosos es que los segundos le dicen no a casi todo. ¿A qué le dijiste no esta semana para proteger lo esencial?',
    locked: true,
    videoId: '72571437-8b62-4e77-b3b0-a203d4f88547',
    context: {
      why: [
        'Hay personas que sí quieren crecer.',
        '',
        'Y aun así…',
        '',
        'Viven con la sensación constante de que nunca les alcanza el tiempo.',
        '',
        'No porque estén haciendo poco.',
        '',
        'Porque su energía está dispersa.',
        '',
        'Atienden pendientes. Responden cosas. Se mantienen ocupados.',
        '',
        '… pero al final del día, lo que verdaderamente importa sigue esperando.',
      ],
      signals: [
        'Terminas días cansad@… pero con la sensación de no haber avanzado en lo esencial',
        'Sabes qué cosas importan… pero constantemente no encuentras tiempo para ellas',
        'Tus prioridades reales suelen quedar para después',
        'Pasas mucho tiempo reaccionando a urgencias pequeñas… mientras lo grande espera',
        'Sientes que haces muchas cosas… pero construyes poco',
      ],
      truth: 'Muchas personas no necesitan más horas. Necesitan mayor intención sobre cómo usan las que ya tienen. Porque cuando tu tiempo no tiene estructura… las distracciones deciden por ti. Lo urgente reemplaza lo importante. Y tu propósito empieza a competir con todo lo demás — no porque no te importe, sino porque no tiene un espacio protegido.',
      objective: 'Aprender a asignarle espacio real a lo que más impacto genera en tu vida. No llenar cada minuto — identificar qué merece tus mejores horas… y protegerlo. Porque cuando lo importante vive solo si sobra tiempo… normalmente nunca llega.',
      keyPhrase: 'No se trata solo de tener tiempo. Se trata de decidir quién lo gobierna.',
      reminder: 'Plasma tus avances y reflexiones en tu Registro del Templario. Tu camino fue diseñado con intención — basado en tu evaluación y en lo que más impacto puede generar hoy. Mantente en la línea marcada. La disciplina multiplica resultados. ⚔️',
    },
  },
{
    slug: 'control-03',
    week: 8,
    protocolo: 'C3',
    title: 'Ritual del Enfoque Matutino',
    subtitle: 'Gana tu mañana antes de que el mundo intente ganarla por ti.',
    type: 'control',
    duration: '25 min',
    xpReward: 50,
    gemReward: 40,
    coinReward: 40,
    evidenceCategory: 'Reto del Iniciado',
    evidencePrompt: 'Tus primeras horas del día revelan quién está tomando las decisiones. ¿Cómo se ven las tuyas ahora?',
    evidenceHint: 'Cuéntanos qué haces diferente desde que eres tú quien decide cómo arranca el día — y qué efecto tuvo eso en tu enfoque, tu humor o tus decisiones.',
    locked: true,
    videoId: '3dbdb44f-bf8e-467f-9e82-29448602350e',
    context: {
      why: [
        'Tu mañana hace más por tu vida de lo que imaginas.',
        '',
        'No solo define cómo empiezas el día.',
        '',
        'Define quién toma el control primero.',
        '',
        'Tú…',
        '',
        '… o tus distracciones.',
        '',
        'Hay personas con metas. Con ambición. Con intención real.',
        '',
        'Pero antes de pensar en su propio rumbo…',
        '',
        '… ya entregaron su enfoque.',
      ],
      signals: [
        'Despiertas y lo primero que haces es revisar el celular',
        'Empiezas el día reaccionando — mensajes, redes, urgencias ajenas',
        'Tus prioridades pierden fuerza conforme avanza la mañana',
        'Terminas días ocupad@… pero no necesariamente orgullos@',
        'Sientes que otros marcan el ritmo de tu día antes de que tú lo hagas',
      ],
      truth: 'No siempre pierdes enfoque por falta de disciplina. Lo pierdes porque tu primera energía ya fue consumida por ruido externo. Lo primero que alimenta tu mente al despertar… suele marcar dirección. Y cuando tu día inicia desde reacción… es más fácil dispersarte, postergar lo importante, y sentir que vas detrás en lugar de delante.',
      objective: 'Recuperar el control de tu primera energía mental. No para que tus mañanas sean perfectas — sino para que dejen de ser automáticas. Porque cuando inicias con claridad… tus decisiones tienen más intención, tu atención se fragmenta menos, y lo importante tiene más posibilidades de suceder.',
      keyPhrase: 'Tu mañana no solo inicia tu día… muchas veces revela quién lo está dirigiendo.',
      reminder: 'Plasma tus avances en tu Registro del Templario. No caminas al azar — cada módulo forma parte de una secuencia diseñada para llevarte a tu siguiente nivel. Primero tu ruta. Luego el resto. 🌟',
    },
  },
{
    slug: 'control-04',
    week: 9,
    protocolo: 'C4',
    title: 'Desafío del Miedo Consciente',
    subtitle: 'El miedo no siempre marca un límite. Muchas veces señala una puerta.',
    type: 'control',
    duration: '25 min',
    xpReward: 50,
    gemReward: 40,
    coinReward: 40,
    evidenceCategory: 'Reto del Iniciado',
    evidencePrompt: 'Hay cosas que evitamos no porque no podamos — sino porque nos incomoda lo que implican. ¿Qué cruzaste esta semana?',
    evidenceHint: 'Nombra lo que enfrentaste. No importa qué tan pequeño parezca desde afuera — cuéntanos qué significó para ti y qué encontraste del otro lado.',
    locked: true,
    videoId: '147fcc19-2a82-4baa-8e3f-07441e2f1bb1',
    context: {
      why: [
        'Hay momentos que pueden cambiar mucho más tu vida de lo que parece.',
        '',
        'Pero suelen venir disfrazados de incomodidad.',
        '',
        'No siempre como peligro real.',
        '',
        'A veces como una conversación pendiente.',
        'Una oportunidad que intimida.',
        'Una decisión que sabes que podría expandirte…',
        '',
        '… y sigues posponiendo.',
        '',
        'No porque no puedas.',
        '',
        'Sino porque esperas sentir más certeza antes de avanzar.',
      ],
      signals: [
        'Hay algo importante que sabes que deberías hacer… y lo sigues aplazando',
        'Esperas el momento ideal para actuar — y ese momento no termina de llegar',
        'Te preparas mucho… pero ejecutas menos de lo que podrías',
        'Algunas oportunidades te intimidan más por lo que representan que por su dificultad real',
        'El miedo al error o al rechazo termina decidiendo por ti antes de que tú decidas',
      ],
      truth: 'Muchas personas no están frenadas por falta de capacidad. Están frenadas porque interpretan el miedo como señal de detenerse. Y eso cambia por completo la dirección de una vida. Porque cuando cada decisión importante depende de sentirte completamente segur@… muchísimas oportunidades quedan del otro lado. No porque fueran imposibles — sino porque nunca se cruzó el puente.',
      objective: 'Identificar un puente que has estado evitando… y demostrarte que puedes empezar a cruzarlo aunque no desaparezca la incomodidad. Porque la confianza no siempre nace antes de actuar — con frecuencia se construye después de comprobarte que sí avanzas.',
      keyPhrase: 'El miedo no siempre marca un límite… muchas veces señala una puerta.',
      reminder: 'Registra cada avance en tu Registro del Templario. Lo que se escribe se vuelve compromiso. Lo que se mide, mejora. Sin registro no hay progreso consciente — este es tu tablero de control. Úsalo. ⚔️',
    },
  },
{
    slug: 'control-05',
    week: 10,
    protocolo: 'C5',
    title: 'Rutina del Guerrero Interior 5-5-5',
    subtitle: 'No basta con despertar. También importa cómo decides presentarte ante tu día.',
    type: 'control',
    duration: '25 min',
    xpReward: 50,
    gemReward: 40,
    coinReward: 40,
    evidenceCategory: 'Reto del Iniciado',
    evidencePrompt: 'Los atletas de élite no esperan sentirse listos para entrenar — tienen un ritual que los activa igual aunque no quieran. ¿Cuál es el tuyo?',
    evidenceHint: 'Describe qué haces en tus primeros minutos y cuéntanos qué diferencia notaste en tu energía o claridad cuando lo respetas.',
    locked: true,
    videoId: '12d2b957-5488-4fbb-8ac0-91bedbe9b50e',
    context: {
      why: [
        'No todos los días se pierden por falta de capacidad.',
        '',
        'Muchos empiezan a desviarse desde los primeros minutos.',
        '',
        'Antes de una mala decisión.',
        'Antes de procrastinar.',
        'Antes de dispersarte.',
        '',
        'Desde cómo entras al día.',
        '',
        'Porque una cosa es despertar…',
        '',
        '… y otra muy distinta es activarte de verdad.',
      ],
      signals: [
        'Hay mañanas donde te cuesta arrancar de verdad — no el cuerpo, la mente',
        'Tu estado mental cambia mucho según cómo comenzó tu mañana',
        'Algunos días avanzas bien… pero otros te sientes desconectad@ desde temprano',
        'Sientes que tardas demasiado en acomodarte — y para entonces ya perdiste tiempo',
        'Quieres mayor constancia… pero tu inicio sigue siendo variable',
      ],
      truth: 'Muchas personas creen que su inconsistencia está solo en disciplina. Pero a veces el verdadero problema es que empiezan sus días sin alineación. Cuerpo apagado. Mente dispersa. Emoción reactiva. Y cuando esas tres áreas despiertan desordenadas… sostener enfoque cuesta más, tomar mejores decisiones cuesta más, mantener dirección cuesta más. No porque seas incapaz — sino porque entraste sin prepararte.',
      objective: 'Diseñar una mañana que no dependa solo de cómo te sientes… sino de una estructura que te ayude a entrar con mayor intención, incluso en días donde no tengas tantas ganas. Activar cuerpo. Ordenar mente. Alinear emoción. No para hacer mañanas perfectas — sino para reducir la probabilidad de empezar desde caos.',
      keyPhrase: 'No basta con despertar… también importa cómo decides presentarte ante tu día.',
      reminder: 'Registra en tu Registro del Templario. Tu ruta fue diseñada con intención — observando dónde estás y qué movimiento puede impulsarte más rápido. Lo que te corresponde hacer ahora no es casualidad. Explora si quieres. Avanza primero en lo esencial. ✨',
    },
  },
{
    slug: 'influencia-01',
    week: 11,
    protocolo: 'I1',
    title: 'Protocolo de Negociación Colaborativa',
    subtitle: 'No entres a vencer. Entra a construir.',
    type: 'influencia',
    duration: '25 min',
    xpReward: 50,
    gemReward: 40,
    coinReward: 40,
    evidenceCategory: 'General discussion',
    evidencePrompt: 'Dicen que en toda negociación hay dos modos: ganar o construir. Esta semana elegiste construir. ¿Qué conversación fue?',
    evidenceHint: 'Cuéntanos qué estaba en juego, qué tuviste que soltar para no ir a ganar — y qué pasó diferente por eso.',
    locked: true,
    videoId: '5ff4f5a0-8fc7-464e-bddf-7051acdabec6',
    context: {
      why: [
        'Saber lo que quieres… no siempre es lo más difícil.',
        '',
        'Lo verdaderamente difícil…',
        '',
        'Es comunicarlo sin convertir la conversación en una batalla.',
        '',
        'Porque hay personas que pierden oportunidades, relaciones y acuerdos…',
        '',
        'No por falta de intención.',
        '',
        'Sino porque cuando la tensión sube…',
        '',
        '… solo saben empujar más fuerte.',
      ],
      signals: [
        'Te importa resolver… pero ciertas conversaciones se tensan más rápido de lo que quisieras',
        'Entras con buenas intenciones… y terminas discutiendo',
        'Te frustras cuando la otra persona se pone defensiva — aunque entiendas por qué lo hace',
        'Quieres expresar tu punto sin dañar relaciones que importan',
        'Sabes que podrías influir más… si manejaras mejor la tensión',
      ],
      truth: 'Muchas personas creen que negociar es imponer, convencer o ganar. Pero cuando alguien siente que perderá… se protege. Y cuando eso pasa, la colaboración desaparece. La conversación deja de enfocarse en resolver… y empieza a enfocarse en defender posiciones. La verdadera fuerza no está en presionar más — está en crear apertura donde otros solo generan resistencia.',
      objective: 'Aprender a dirigir conversaciones difíciles sin romperlas. Bajar defensiva, separar problema de persona, reducir fricción innecesaria y construir acuerdos más inteligentes. No desde sumisión — desde liderazgo estratégico.',
      keyPhrase: 'El templario no entra a una conversación difícil para vencer… entra para resolver sin romper lo que aún puede fortalecerse.',
      reminder: 'Tu ruta fue diseñada con intención. Lo que trabajas ahora no es casualidad — es el movimiento que más impacto tendrá en tu avance. Registra cada conversación, cada aprendizaje, cada ajuste en tu Registro del Templario. ✨',
    },
  },
  {
    slug: 'influencia-02',
    week: 12,
    protocolo: 'I2',
    title: 'Tono, Pausas y Ritmo que Inspiran Calma',
    subtitle: 'No siempre cambia una conversación quien más habla.',
    type: 'influencia',
    duration: '25 min',
    xpReward: 50,
    gemReward: 40,
    coinReward: 40,
    evidenceCategory: 'General discussion',
    evidencePrompt: 'No siempre cambia una conversación quien más argumenta. A veces la cambia quien sabe cuándo bajar el tono. ¿Cuándo lo hiciste tú?',
    evidenceHint: 'Puede ser una pausa, un silencio, una palabra dicha diferente. Cuéntanos el momento y qué generó en la otra persona.',
    locked: true,
    videoId: '3eb07546-d86e-4c92-82ab-e8160919b551',
    context: {
      why: [
        'Saber qué decir importa.',
        '',
        'Pero hay algo que cambia por completo cómo te reciben:',
        '',
        'Cómo suenas cuando lo dices.',
        '',
        'Puedes tener razón…',
        '',
        '… pero si hablas desde tensión, prisa o presión…',
        '',
        'La otra persona no siente claridad.',
        '',
        'Siente impacto.',
        '',
        'Y cuando alguien siente presión… se protege.',
      ],
      signals: [
        'En conversaciones importantes, aceleras más de lo normal sin darte cuenta',
        'Cuando hay tensión, tu tono cambia — y lo notas después, no durante',
        'Hablas rápido para explicarte mejor… pero terminas generando más ruido',
        'Te cuesta usar pausas sin sentir incomodidad',
        'Sabes lo que quieres comunicar… pero no siempre transmites calma al hacerlo',
      ],
      truth: 'La comunicación no solo se escucha — se siente. Tu ritmo, tu tono, tu volumen y tus pausas influyen directamente en cómo reaccionan contigo. Si tu voz transmite ansiedad, urgencia o agresividad… aunque tu mensaje sea bueno, la conexión se debilita. Hablar con calma no significa hablar débil — significa transmitir seguridad sin generar resistencia.',
      objective: 'Aprender a regular la energía con la que entregas tu mensaje. No solo lo que dices — cómo lo dices. Porque cuando controlas tu voz… controlas presencia. Y presencia calma abre conversaciones que la urgencia cierra.',
      keyPhrase: 'No siempre cambia una conversación quien más habla… muchas veces la transforma quien sabe transmitir calma mientras habla.',
      reminder: 'Anota tus avances en tu Registro del Templario. Cada conversación es un campo de entrenamiento. Con calma. Con intención. Sin distracciones. 🌊',
    },
  },
  {
    slug: 'influencia-03',
    week: 13,
    protocolo: 'I3',
    title: 'El Poder de la Venta Ética',
    subtitle: 'La venta más poderosa nace de entender profundamente y proponer con verdad.',
    type: 'influencia',
    duration: '25 min',
    xpReward: 50,
    gemReward: 40,
    coinReward: 40,
    evidenceCategory: 'General discussion',
    evidencePrompt: 'Antes de hablar de lo que querías conseguir — ¿te detuviste a entender de verdad lo que necesitaba la otra persona?',
    evidenceHint: 'Los mejores vendedores del mundo no venden productos — conectan problemas con soluciones. Cuéntanos cómo lo hiciste tú: qué identificaste, qué propusiste y cómo respondieron.',
    locked: true,
    videoId: '25b2e21a-e855-41d2-bb88-652ef1818d0d',
    context: {
      why: [
        'Muchas personas escuchan "venta"…',
        '',
        '… y piensan en presión.',
        '',
        'En convencer. Empujar. Cerrar.',
        '',
        'Pero esa visión limita todo lo que realmente significa influir.',
        '',
        'Porque vender, en esencia…',
        '',
        'Es lograr que una idea, una solución o una propuesta…',
        '',
        '… genere apertura.',
        '',
        'Y eso ya impacta tu vida todos los días.',
      ],
      signals: [
        'Tienes buenas ideas… pero a veces no logras que otros conecten con ellas',
        'Explicas desde lo que tú quieres… más que desde lo que la otra persona necesita',
        'Te incomoda "vender" porque lo asocias con manipulación — aunque no sea tu intención',
        'Quieres influir más sin sentirte invasivo',
        'Buscas que tu palabra genere confianza, no resistencia',
      ],
      truth: 'La verdadera influencia no empieza hablando — empieza entendiendo. Porque cuando comprendes primero qué necesita, qué le duele o qué quiere resolver la otra persona… tu propuesta deja de sentirse como presión. Y empieza a sentirse como aporte. La venta ética no es manipular — es conectar una necesidad real con una solución real.',
      objective: 'Dejar de comunicar solo desde tu intención… y empezar a construir desde el valor real para la otra persona. Porque cuando entiendes primero… influyes mucho mejor después. Y cuando la otra persona percibe verdad… la resistencia baja.',
      keyPhrase: 'La venta más poderosa no nace de presionar para convencer… nace de entender profundamente y proponer con verdad.',
      reminder: 'Registra en tu Registro del Templario cada conversación donde apliques esto. Tu plan es la misión. Todo lo demás es complemento. ⚔️',
    },
  },
{
    slug: 'influencia-04',
    week: 14,
    protocolo: 'I4',
    title: 'Cómo Influir desde el Ejemplo',
    subtitle: 'No intentes convencer tanto con tu voz… conviértete en alguien cuyas acciones hagan más fácil creer.',
    type: 'influencia',
    duration: '25 min',
    xpReward: 50,
    gemReward: 40,
    coinReward: 40,
    evidenceCategory: 'General discussion',
    evidencePrompt: 'Las palabras convencen. Los ejemplos arrastran. ¿Qué hiciste esta semana que no necesitó explicación?',
    evidenceHint: 'Cuéntanos la acción — no lo que dijiste sino lo que hiciste — y qué cambió en cómo te perciben quienes te rodean.',
    locked: true,
    videoId: '7a840d36-5905-47df-827c-2266d3c4502d',
    context: {
      why: [
        'Hablar bien puede abrir atención.',
        '',
        'Pero hay algo mucho más poderoso:',
        '',
        'Lo que haces cuando nadie te escucha hablar.',
        '',
        'Porque muchas personas intentan influir corrigiendo,',
        'explicando,',
        'dando instrucciones…',
        '',
        'Pero si sus acciones contradicen sus palabras…',
        '',
        '… la influencia se rompe.',
        '',
        'No por falta de intención.',
        'Por falta de coherencia.',
      ],
      signals: [
        'Quieres inspirar más respeto… pero a veces tus acciones no siempre sostienen lo que dices',
        'Te frustra cuando otros no reaccionan como esperabas — aunque les hayas explicado bien',
        'A veces exiges cosas que tú también estás trabajando en mejorar',
        'Sabes comunicar… pero quieres que tu presencia pese más sin tener que repetir tanto',
        'Buscas credibilidad real — no solo buenas intenciones',
      ],
      truth: 'Las personas pueden escuchar tus palabras… pero terminan creyendo lo que ven repetidamente en ti. Si dices disciplina pero actúas sin constancia… si pides compromiso pero no sostienes el tuyo… el mensaje pierde fuerza. Influir desde el ejemplo no significa ser perfecto — significa reducir la distancia entre tus palabras y tus acciones.',
      objective: 'Fortalecer congruencia. Alinear más profundamente lo que dices con lo que haces. Porque cuando tu ejemplo se vuelve claro… tu influencia deja de depender de explicación constante. Ahí dejas de perseguir credibilidad — y empiezas a generarla.',
      keyPhrase: 'No intentes convencer tanto con tu voz… conviértete en alguien cuyas acciones hagan más fácil creer.',
      reminder: 'Registra cada paso y reflexión en tu Registro del Templario. Este será el mapa de tu crecimiento y liderazgo auténtico. Camina con intención. Siempre. ✨',
    },
  },
  {
    slug: 'influencia-05',
    week: 15,
    protocolo: 'I5',
    title: 'Puntualidad y Promesas: Tu Nombre como Garantía',
    subtitle: 'Constrúyelo con promesas tan claras… que tu cumplimiento hable por ti.',
    type: 'influencia',
    duration: '25 min',
    xpReward: 50,
    gemReward: 40,
    coinReward: 40,
    evidenceCategory: 'General discussion',
    evidencePrompt: 'Tu reputación no se construye en los grandes momentos. Se construye en los pequeños compromisos que nadie vigila. ¿Cuál cumpliste esta semana?',
    evidenceHint: 'Cuéntanos qué prometiste, cómo lo honraste exactamente como lo dijiste y qué generó eso — en ti o en quien confió en tu palabra.',
    locked: true,
    videoId: 'fc099f7c-4314-4506-b577-aaf639d45425',
    context: {
      why: [
        'Tener talento puede abrir oportunidades.',
        '',
        'Pero hay algo que determina si realmente confían en ti:',
        '',
        'Tu capacidad de cumplir…',
        '',
        '… cuando dijiste que lo harías.',
        '',
        'Porque muchas personas quieren crecer,',
        'liderar,',
        'inspirar confianza…',
        '',
        'Pero descuidan algo silencioso:',
        '',
        'Su palabra.',
        '',
        'Y cuando tu palabra pierde fuerza…',
        '',
        '… tu nombre también.',
      ],
      signals: [
        'A veces dices "sí" demasiado rápido… y luego te cuesta sostenerlo',
        'Has pospuesto cosas pequeñas sin medir cómo impacta tu credibilidad',
        'Quieres que confíen más en ti… pero a veces dejas espacio para la duda',
        'Buscas verte como alguien capaz… pero ciertas fallas debilitan esa imagen',
        'Quieres construir una reputación fuerte… no solo buenas intenciones',
      ],
      truth: 'La confianza profunda no se gana con carisma, talento o buenas ideas. Se construye de forma mucho más simple: cumpliendo. Cada vez que dices que harás algo… tu nombre entra en juego. Y cuando no cumples, aunque sea en cosas pequeñas… no solo se retrasa una tarea. Se debilita la certeza de que pueden contar contigo.',
      objective: 'Volver tu palabra más precisa, más consciente y más fuerte. Aprender a prometer mejor… y cumplir con precisión. No se trata de decir "sí" a todo — se trata de que cada "sí" tenga peso real. Porque cuando las personas saben que si tú lo dices, sucede… tu reputación cambia. Tus oportunidades cambian.',
      keyPhrase: 'No construyas tu nombre solo con intención… constrúyelo con promesas tan claras que tu cumplimiento hable por ti.',
      reminder: 'Tu Registro del Templario es esencial para documentar compromisos, avances y aprendizajes. La verdadera transformación no nace de la cantidad de caminos recorridos — sino de la constancia con la que honras el tuyo. Sigue firme. ⚔️',
    },
  },
{
    slug: 'autonomia-01',
    week: 16,
    protocolo: 'A1',
    title: 'Tu Entorno Importa — Parte 1',
    subtitle: 'Tu entorno no siempre decide por ti… pero sí influye silenciosamente en la persona que estás practicando ser.',
    type: 'autonomia',
    duration: '25 min',
    xpReward: 50,
    gemReward: 40,
    coinReward: 40,
    evidenceCategory: 'Corrección Divina',
    evidencePrompt: 'Muchas veces no es falta de disciplina — es que algo en tu entorno estaba jalando en dirección contraria. ¿Qué identificaste?',
    evidenceHint: 'Jim Rohn decía que eres el promedio de las 5 personas con las que más convives. Pero también el promedio de los espacios, contenidos y hábitos que normalizas. ¿Qué de todo eso cambiaste esta semana?',
    locked: true,
    videoId: 'f5ec73e6-4448-4804-95e3-4529f700269b',
    context: {
      why: [
        'Hay batallas que muchas personas creen que están perdiendo por falta de disciplina…',
        '',
        'Cuando en realidad…',
        '',
        '… las están perdiendo por exposición constante.',
        '',
        'Porque no siempre es que no quieras crecer.',
        '',
        'Sí quieres avanzar.',
        'Sí quieres cambiar.',
        'Sí quieres elevarte.',
        '',
        'Pero pasas demasiadas horas rodead@ de cosas que sabotean esa dirección…',
        '',
        '… sin darte cuenta.',
      ],
      signals: [
        'Hay momentos donde te sientes motivad@… pero ciertos espacios te apagan',
        'Intentas enfocarte… pero tu entorno facilita más la distracción que el progreso',
        'Convives con personas que normalizan hábitos que ya no quieres sostener',
        'Consumes contenido que te drena más de lo que te fortalece',
        'Quieres avanzar… pero ciertos ambientes hacen más difícil sostener tu estándar',
      ],
      truth: 'Aunque tengas potencial… tu entorno influye en lo que normalizas, lo que toleras, lo que repites, y lo que terminas creyendo posible. A veces lo más peligroso no es lo obvio — es aquello que poco a poco baja tu estándar sin que parezca grave. Una voz. Un hábito. Un espacio. Una distracción repetida. Y con el tiempo… eso también construye destino.',
      objective: 'Observar tu entorno con mayor honestidad e intención. No para obsesionarte con controlarlo todo — sino para dejar de vivir rodead@ de elementos que contradicen lo que dices que quieres construir. Un guerrero no solo trabaja en sí mismo… también protege el terreno donde su identidad se fortalece.',
      keyPhrase: 'Tu entorno no siempre decide por ti… pero sí influye silenciosamente en la persona que estás practicando ser.',
      reminder: 'Registra en tu Registro del Templario qué impulsa y qué desgasta. Confía en el proceso. Concéntrate donde tu energía realmente cuenta. Primero tu ruta. Luego el resto. 🌟',
    },
  },
  {
    slug: 'autonomia-02',
    week: 17,
    protocolo: 'A2',
    title: 'Tu Entorno Importa — Parte 2',
    subtitle: 'Madurar no siempre significa alejarte de quienes amas… a veces significa no perderte a ti mism@ mientras avanzas cerca de ellos.',
    type: 'autonomia',
    duration: '25 min',
    xpReward: 50,
    gemReward: 40,
    coinReward: 40,
    evidenceCategory: 'Corrección Divina',
    evidencePrompt: 'Crecer a veces incomoda a quienes te conocen de antes. ¿Cómo mantuviste tu dirección sin romper lo que importa?',
    evidenceHint: 'No tienes que dar nombres. Cuéntanos la dinámica — cómo navegaste esa presión y qué aprendiste de mantenerte firme sin pelear.',
    locked: true,
    videoId: '176629a0-eeec-4c78-a9df-51fd4d66c299',
    context: {
      why: [
        'Detectar qué te influye… ya cambia mucho.',
        '',
        'Pero hay un nivel más difícil:',
        '',
        '¿Qué haces cuando lo que interfiere con tu enfoque…',
        '',
        '… no es una distracción cualquiera…',
        '',
        'sino personas que forman parte de tu vida?',
        '',
        'Porque una cosa es identificar ruido externo.',
        '',
        'Y otra muy distinta…',
        'es aprender a proteger tu dirección',
        'sin sentir que tienes que pelear, huir o romperlo todo.',
      ],
      signals: [
        'Te importa tu crecimiento… pero ciertas personas hacen más difícil sostenerlo',
        'Sientes presión por no incomodar, decepcionar o parecer "demasiado cambiante"',
        'A veces bajas tu intensidad para evitar críticas, burlas o conflicto',
        'Te cuesta mantener enfoque cuando quienes te rodean no entienden tu visión',
        'Sabes lo que quieres… pero tu entorno cercano altera cómo lo sostienes',
      ],
      truth: 'Muchas personas no abandonan sus metas porque no las quieran — las abandonan porque no desarrollan suficiente firmeza para protegerlas. Cuando no sabes cuidar tu energía… empiezas a negociar contigo mism@ para encajar, evitar tensión, o sentir aprobación. Y poco a poco, sin darte cuenta, tu vida empieza a moldearse más por reacción que por convicción.',
      objective: 'Aprender a mantener tu dirección incluso cuando no todos la comprendan. No desde agresividad — desde firmeza. Puedes amar. Puedes convivir. Puedes escuchar. Sin perder claridad sobre lo que estás construyendo. Porque cuando dejas de vivir buscando aprobación… empiezas a construir autenticidad sostenida.',
      keyPhrase: 'Madurar no siempre significa alejarte de quienes amas… a veces significa aprender a no perderte a ti mism@ mientras avanzas cerca de ellos.',
      reminder: 'Camina con intención. Tu Registro del Templario es donde proteges tu visión por escrito. Lo que no escribes… es más fácil que el ruido externo borre. ✨',
    },
  },
  {
    slug: 'autonomia-03',
    week: 18,
    protocolo: 'A3',
    title: 'Creencias Limitantes',
    subtitle: 'No siempre necesitas esforzarte más… a veces necesitas dejar de construir sobre creencias que jamás debieron gobernarte.',
    type: 'autonomia',
    duration: '25 min',
    xpReward: 50,
    gemReward: 40,
    coinReward: 40,
    evidenceCategory: 'Corrección Divina',
        evidencePrompt: 'Hay un pensamiento sobre ti que llevas tiempo repitiendo como si fuera un hecho — y esta semana lo cuestionaste. ¿Cuál fue?',
    evidenceHint: 'Escribe la creencia que descubriste, de dónde crees que viene y con qué convicción nueva la estás reemplazando. No tiene que estar resuelto — solo iniciado.',

    locked: true,
    videoId: 'e471ba1a-e75f-4d7d-8bd5-856c07aa78a1',
    context: {
      why: [
        'A veces el mayor obstáculo no está en lo que pasa afuera…',
        '',
        'Está en lo que llevas años repitiendo dentro…',
        '',
        '… sin cuestionarlo.',
        '',
        'Porque hay una diferencia enorme entre enfrentar límites reales…',
        '',
        'Y vivir condicionado por ideas que aprendiste,',
        'absorbiste,',
        'o repetiste tanto…',
        '',
        '… que terminaste tratándolas como verdad.',
        '',
        'Tu mente no las siente como límite.',
        '',
        'Las siente como lógica.',
      ],
      signals: [
        'Quieres avanzar… pero algo dentro de ti siempre duda antes de actuar',
        'Tienes metas… pero ciertas ideas te hacen sentir que quizá no son para ti',
        'Te saboteas antes de intentarlo — por miedo a confirmar inseguridades',
        'Te cuesta sostener nuevas decisiones porque una parte de ti sigue creyendo versiones viejas',
        'Sabes lo que quieres… pero creencias heredadas alteran lo que consideras posible',
      ],
      truth: 'Muchas personas no viven pequeñas porque no tengan capacidad — viven pequeñas porque construyen su vida sobre pensamientos limitados que nunca revisaron. Una creencia limitante no solo afecta cómo piensas. Afecta lo que intentas, lo que permites, lo que toleras, y hasta lo que crees merecer. Puedes pasar años creyendo que simplemente "así eres"… cuando en realidad solo has estado operando desde un sistema mental no cuestionado.',
      objective: 'Identificar una creencia que hoy limite tu crecimiento… y comenzar a reemplazarla por una convicción más poderosa. No desde fantasía — desde reconstrucción consciente. Porque lo que aprendiste puede influir. Pero no tiene que definirte para siempre.',
      keyPhrase: 'No siempre necesitas esforzarte más para cambiar tu vida… a veces necesitas dejar de construirla sobre creencias que jamás debieron gobernarte.',
      reminder: 'Tu Registro del Templario es el cuaderno de batalla donde documentas cada frase que reemplazas, cada victoria interna. Explora si quieres. Avanza primero en lo que te corresponde. ✨',
    },
  },
  {
    slug: 'autonomia-04',
    week: 19,
    protocolo: 'A4',
    title: 'Refuerza tu Valor Propio',
    subtitle: 'Tu valor no se construye solo con lo que harás… también se fortalece cuando recuerdas todo lo que ya has conquistado.',
    type: 'autonomia',
    duration: '25 min',
    xpReward: 50,
    gemReward: 40,
    coinReward: 40,
    evidenceCategory: 'Corrección Divina',
    evidencePrompt: 'Hay cosas que has logrado que mencionas poco — o que minimizas sin darte cuenta. Hoy las nombramos.',
    evidenceHint: 'Comparte 3 victorias reales que normalmente pasas por alto. No tienen que ser enormes — lo importante es que sean tuyas y que las reconozcas de verdad.',
    locked: true,
    videoId: 'c2bf4f05-f29f-4515-8b27-ac7e49a55319',
    context: {
      why: [
        'Muchas personas sí avanzan.',
        '',
        'Sí cumplen.',
        '',
        'Sí han superado cosas difíciles.',
        '',
        'Pero cuando llega un nuevo reto…',
        '',
        '… dudan como si nunca antes hubieran podido.',
        '',
        'No porque les falte capacidad.',
        '',
        'Sino porque han dejado de usar',
        'su propia evidencia.',
      ],
      signals: [
        'Haces cosas importantes… pero sientes que no cuentan suficiente',
        'Recuerdas más tus errores que tus avances — aunque los avances sean reales',
        'Enfrentas retos nuevos como si empezaras desde cero cada vez',
        'Tu seguridad depende demasiado de resultados recientes',
        'Te enfocas tanto en lo que falta… que minimizas lo que ya has logrado',
      ],
      truth: 'Muchas personas no tienen falta de valor — tienen falta de memoria consciente sobre su propio valor. Cuando ignoras tus victorias… tu mente empieza a actuar como si no existieran. Y entonces cada reto parece más grande, cada duda pesa más, y cada paso incierto se siente como prueba de incapacidad… cuando muchas veces ya has demostrado antes que puedes.',
      objective: 'Recordar, registrar y reforzar evidencia real de tu capacidad. No desde ego — desde certeza. Porque la confianza real no nace de aplausos externos. Nace de recordar, integrar y usar la evidencia de tus propias batallas ganadas. Cada victoria reconocida… fortalece identidad.',
      keyPhrase: 'Tu valor no se construye solo con lo que harás… también se fortalece cuando recuerdas, con claridad, todo lo que ya has conquistado.',
      reminder: 'Tu Registro del Templario es el tesoro donde guardas cada victoria. Documenta, siente y fortalece cada recuerdo. Aquí reside tu poder más auténtico. Con calma. Con intención. Sin distracciones. 🦅',
    },
  },
  {
    slug: 'autonomia-05',
    week: 20,
    protocolo: 'A5',
    title: 'De Víctima a Templario de mi Propósito',
    subtitle: 'Tu vida cambia cuando dejas de preguntarte por qué te pasa esto… y empiezas a preguntarte qué harás ahora con lo que tienes.',
    type: 'autonomia',
    duration: '25 min',
    xpReward: 50,
    gemReward: 40,
    coinReward: 40,
    evidenceCategory: 'Corrección Divina',
        evidencePrompt: 'Hay una versión de ti que esperaba que las cosas cambiaran solas. Esta semana elegiste algo diferente. ¿Qué fue?',
    evidenceHint: 'Cuéntanos la historia que te contabas, cómo la reescribiste — y la acción concreta que demostró que ya no eres esa versión. Las palabras cambian poco. Las acciones cambian todo.',
    locked: true,
    videoId: '6981a6df-25c0-44ec-9aba-c9abe10d3eb4',
    context: {
      why: [
        'Hay momentos donde el mayor freno no es tu entorno…',
        '',
        '… ni tus circunstancias…',
        '',
        '… ni siquiera lo que pasó antes.',
        '',
        'Es la forma en la que interpretas tu propia vida.',
        '',
        'Porque cuando constantemente te dices',
        'que no puedes,',
        'que no tienes tiempo,',
        'que así eres…',
        '',
        '… sin darte cuenta…',
        '',
        'empiezas a ceder poder.',
      ],
      signals: [
        'Quieres avanzar… pero repites razones para postergarte',
        'Te descubres justificando más de lo que ejecutas',
        'A veces culpas al tiempo, al entorno o a otros… aunque sabes que no es toda la historia',
        'Tu diálogo interno debilita tu acción antes de que empieces',
        'Sabes que podrías liderar más tu vida… pero ciertas frases te mantienen pequeño',
      ],
      truth: 'Muchas personas no se quedan atrapadas solo por lo que viven — se quedan atrapadas por la narrativa que repiten sobre eso. Cuando tu voz interior funciona desde impotencia… tus decisiones empiezan a reflejarlo. Y poco a poco dejas de verte como alguien que construye su camino… y empiezas a reaccionar como si solo pudieras soportarlo.',
      objective: 'Detectar una narrativa que te debilita… reescribirla como líder… y demostrarlo con una acción concreta. No desde perfección — desde responsabilidad. Porque cuando cambias cómo te hablas… empiezas a cambiar cómo vives. No cuando controlas todo — cuando lideras lo que sí depende de ti.',
      keyPhrase: 'Tu vida cambia cuando dejas de preguntarte por qué te pasa esto… y empiezas a preguntarte qué harás ahora con lo que tienes.',
      reminder: 'Registra en tu Registro del Templario. Menos ruido. Más precisión. La maestría nace del enfoque, no de la prisa. Sigue primero tu plan. Lo demás es complemento, no prioridad. 🌿',
    },
  },
{
    slug: 'autorrealizacion-01',
    week: 21,
    protocolo: 'R1',
    title: 'La Vida de un Templario — Hazlo Fácil',
    subtitle: 'No se trata de cargar más. Se trata de construir un entorno que trabaje para ti.',
    type: 'autorrealizacion',
    duration: '25 min',
    xpReward: 50,
    gemReward: 40,
    coinReward: 40,
    evidenceCategory: 'Logros Templarios',
    evidencePrompt: 'La disciplina que dura no depende solo de fuerza de voluntad — depende de qué tan bien está diseñado tu entorno. ¿Qué ajustaste?',
    evidenceHint: 'Cuéntanos el cambio — pequeño o grande — y cómo se sintió cuando avanzar dejó de ser una batalla y empezó a ser lo natural.',    locked: true,
    videoId: 'PENDIENTE-R1',
    context: {
      why: [
        'Has llegado hasta aquí.',
        '',
        'Eso ya te separa del 97% que nunca llegó.',
        '',
        'Y ahora el trabajo es diferente.',
        '',
        'No se trata de imponerte más cargas.',
        'No se trata de vivir bajo rigidez inflexible.',
        '',
        'Se trata de algo más sofisticado:',
        '',
        'Crear coherencia entre lo que deseas…',
        '',
        '… y las acciones que eliges realizar.',
        '',
        'De manera estratégica.',
        'Y ligera.',
      ],
      signals: [
        'Ya tienes disciplina… ahora buscas que no se sienta como peso constante',
        'Quieres que tus hábitos fluyan — no que dependan solo de fuerza de voluntad',
        'Sientes que tu entorno aún no trabaja completamente a tu favor',
        'Buscas estructura sin rigidez — dirección sin que se sienta una jaula',
        'Estás listo para un nivel donde el sistema hace parte del trabajo por ti',
      ],
      truth: 'Un verdadero Templario no carga solo con disciplina bruta. Diseña su entorno para que avanzar sea el camino de menor resistencia. Cada pequeña victoria diaria, en los momentos exactos donde tu energía fluye, se acumula y construye identidad sin que el proceso se sienta pesado. La maestría no es esfuerzo máximo — es coherencia sostenida.',
      objective: 'Construir un entorno que trabaje para ti, no contra ti. Aprovechar tus picos de energía para incorporar hábitos sostenibles. Transformar sueños abstractos en acciones concretas que encajen en tu vida real — sin que el proceso se convierta en otra carga.',
      keyPhrase: 'Ser Templario no significa cargar más… significa construir tan bien tu entorno que avanzar se vuelva lo natural.',
      reminder: 'Registra en tu Registro del Templario. Has recorrido un camino que pocos terminan. Lo que construyes ahora no es motivación — es identidad. 🔥',
    },
  },
  {
    slug: 'autorrealizacion-02',
    week: 22,
    protocolo: 'R2',
    title: 'Define tu Ikigai — Encuentra tu Propósito',
    subtitle: 'No se trata solo de encontrar una meta. Se trata de descubrir la razón que hace que todo lo demás valga.',
    type: 'autorrealizacion',
    duration: '25 min',
    xpReward: 50,
    gemReward: 40,
    coinReward: 40,
    evidenceCategory: 'Logros Templarios',
    evidencePrompt: 'Hay algo que haces donde el tiempo desaparece, eres bueno en ello y le aporta algo real al mundo. Eso es tu Ikigai. ¿Cómo se ve el tuyo?',
    evidenceHint: 'No tiene que estar completo ni perfecto. Escribe lo que ya puedes ver — aunque sea un pedazo. Lo honesto siempre pesa más que lo pulido.',    locked: true,
    videoId: 'PENDIENTE-R2',
    context: {
      why: [
        'Hay personas que avanzan.',
        '',
        'Que ejecutan.',
        'Que cumplen.',
        '',
        'Y aun así…',
        '',
        '… a veces sienten que algo no termina de encenderse.',
        '',
        'No por falta de disciplina.',
        '',
        'Sino porque aún no han conectado profundamente',
        'con la razón más verdadera',
        'de por qué están construyendo todo esto.',
      ],
      signals: [
        'Avanzas… pero a veces no sabes exactamente hacia qué',
        'Tienes metas claras… pero no siempre sientes que son completamente tuyas',
        'Buscas algo que te haga levantarte con energía — no solo con obligación',
        'Sientes que hay una versión de ti con más claridad y dirección… y quieres llegar ahí',
        'Estás listo para ir más allá de los objetivos — y conectar con el propósito',
      ],
      truth: 'Reconocer tu ikigai no es solo identificar una meta. Es descubrir esa razón poderosa que convierte cada decisión, cada paso y cada desafío en parte de un camino con sentido. Cuando alineas tus acciones con ese propósito… el esfuerzo cambia de naturaleza. Ya no se siente como carga. Se siente como construcción.',
      objective: 'Conectar con la esencia más profunda de tu misión. Definir ese propósito que da claridad, dirección e impacto real — no solo a lo que haces, sino a quién estás decidiendo ser. Porque cuando sabes por qué construyes… el cómo se vuelve mucho más claro.',
      keyPhrase: 'No se trata de encontrar una meta más… se trata de descubrir la razón que hace que todo lo demás valga.',
      reminder: 'Plasma tu ikigai en tu Registro del Templario. No como ejercicio — como declaración. Lo que escribes con claridad… empieza a dirigir tu vida con más fuerza. 🔥',
    },
  },
  {
    slug: 'autorrealizacion-03',
    week: 23,
    protocolo: 'R3',
    title: 'Estrategias para Romper Estancamientos de Hábito',
    subtitle: 'La disciplina no se pierde por debilidad. A veces se pierde por falta de frescura.',
    type: 'autorrealizacion',
    duration: '25 min',
    xpReward: 50,
    gemReward: 40,
    coinReward: 40,
    evidenceCategory: 'Logros Templarios',
    evidencePrompt: 'Todo hábito tiene un punto donde empieza a sentirse pesado. No es señal de falla — es señal de que necesita evolucionar. ¿Cuál fue el tuyo?',
    evidenceHint: 'Cuéntanos qué estaba perdiendo energía, qué ajustaste para devolverle vida y cómo se sintió cuando volvió a fluir.',
    locked: true,
    videoId: 'PENDIENTE-R3',
    context: {
      why: [
        'Llegaste lejos con disciplina.',
        '',
        'Pero hay un momento que casi nadie anticipa:',
        '',
        'Cuando lo que antes funcionaba…',
        '',
        '… empieza a sentirse pesado.',
        '',
        'No porque seas menos disciplinado.',
        '',
        'Sino porque la mente necesita renovación',
        'tanto como el músculo necesita descanso.',
        '',
        'El estancamiento no siempre es señal de retroceso.',
        '',
        'A veces es señal de que necesitas',
        'evolucionar el sistema.',
      ],
      signals: [
        'Hábitos que antes fluían ahora cuestan más de lo normal',
        'Sientes que estás haciendo lo correcto… pero sin la energía de antes',
        'La motivación baja en ciclos — y cada vez cuesta más recuperarla',
        'Buscas frescura sin perder estructura',
        'Sabes que necesitas algo diferente — no abandonar, sino renovar',
      ],
      truth: 'La constancia no significa hacer lo mismo para siempre de la misma manera. Los Templarios más sólidos no son los que nunca flaquean — son los que saben cuándo ajustar, cuándo descansar conscientemente, y cuándo cambiar de contexto para volver con más fuerza. Pequeñas adaptaciones estratégicas son parte del proceso, no señal de falla.',
      objective: 'Aprender a detectar el estancamiento antes de que se convierta en abandono. Incorporar variaciones, reinicio consciente y cambio de contexto como herramientas activas — no como rendición. Porque la disciplina que dura es la que sabe renovarse.',
      keyPhrase: 'La disciplina que dura no es la más rígida… es la que sabe cuándo renovarse para seguir siendo fuerte.',
      reminder: 'Comparte tus avances en la comunidad. Registra en tu Registro del Templario. Lo que se mide, mejora. Lo que se celebra, se repite. ⚔️',
    },
  },
  {
    slug: 'autorrealizacion-04',
    week: 24,
    protocolo: 'R4',
    title: 'Supera el Miedo a la Incomodidad',
    subtitle: 'La incomodidad no es el enemigo. Es el campo donde se forja lo que nadie más está dispuesto a construir.',
    type: 'autorrealizacion',
    duration: '25 min',
    xpReward: 50,
    gemReward: 40,
    coinReward: 40,
    evidenceCategory: 'Logros Templarios',
    evidencePrompt: 'Hubo algo esta semana que tu versión de hace unos meses hubiera evitado. Tú no lo evitaste. ¿Qué fue?',
    evidenceHint: 'Describe qué te costó, qué pasó por tu cabeza justo antes de hacerlo y qué encontraste cuando lo cruzaste de todas formas.',
    locked: true,
    videoId: 'PENDIENTE-R4',
    context: {
      why: [
        'Hay un nivel de crecimiento',
        'que no se alcanza con más información.',
        '',
        'Ni con más motivación.',
        '',
        'Ni con mejores estrategias.',
        '',
        'Se alcanza cuando decides entrar',
        'conscientemente a lo que te incomoda.',
        '',
        'Porque en este punto del camino…',
        '',
        'Lo que te frena ya no es falta de conocimiento.',
        '',
        'Es la resistencia a sentir lo que no quieres sentir',
        'mientras avanzas hacia lo que sí quieres construir.',
      ],
      signals: [
        'Sabes lo que tienes que hacer… pero postergarlo se siente más cómodo que empezarlo',
        'Hay niveles de crecimiento que ves claramente… pero que te cuesta cruzar',
        'La incomodidad sigue siendo una señal de detenerte, no de avanzar',
        'Buscas más resiliencia — no solo motivación temporal',
        'Estás listo para convertir lo incómodo en campo de entrenamiento, no en razón para parar',
      ],
      truth: 'El miedo a la incomodidad no desaparece con el tiempo — se transforma. Los que llegan lejos no son los que dejaron de sentirla. Son los que aprendieron a moverse mientras existe. La incomodidad es el campo fértil donde nace la resiliencia, la creatividad y la adaptación. No es la señal de que algo está mal — es la señal de que algo importante está sucediendo.',
      objective: 'Convertir la incomodidad en aliada consciente. Desarrollar resiliencia y fortaleza mental que no dependan de condiciones perfectas. Ampliar la zona de crecimiento no por impulso — sino por decisión sostenida de un Templario que ya sabe lo que hay al otro lado.',
      keyPhrase: 'La incomodidad no es el enemigo… es el campo donde se forja lo que nadie más está dispuesto a construir.',
      reminder: 'Registra cada momento donde elegiste avanzar a pesar de la incomodidad. Esas entradas en tu Registro del Templario son tu evidencia más poderosa. 🔥',
    },
  },
  {
    slug: 'autorrealizacion-05',
    week: 25,
    protocolo: 'R5',
    title: 'Método Recompensas Inmediatas',
    subtitle: 'El cerebro aprende lo que repites. Dale razones para repetir lo que importa.',
    type: 'autorrealizacion',
    duration: '25 min',
    xpReward: 50,
    gemReward: 40,
    coinReward: 40,
    evidenceCategory: 'Logros Templarios',
    evidencePrompt: 'El cerebro no distingue entre disciplina y placer — aprende lo que se repite con recompensa. ¿Cómo diseñaste el tuyo para que quiera repetir lo que más importa?',
    evidenceHint: 'Cuéntanos qué hábito conectaste a una recompensa, cuál fue y qué cambió en tu consistencia desde que dejó de depender solo de fuerza de voluntad.',
    locked: true,
    videoId: 'PENDIENTE-R5',
    context: {
      why: [
        'Has construido disciplina.',
        '',
        'Has forjado identidad.',
        '',
        'Has llegado donde muy pocos llegan.',
        '',
        'Y ahora…',
        '',
        'El último nivel no se trata de más esfuerzo.',
        '',
        'Se trata de algo más sofisticado:',
        '',
        'Hacer que tu cerebro',
        'quiera repetir',
        'lo que ya sabes que funciona.',
      ],
      signals: [
        'Sabes lo que debes hacer… pero a veces el inicio cuesta más de lo necesario',
        'Buscas que tus hábitos se vuelvan automáticos — no que dependan siempre de decisión consciente',
        'Quieres acelerar la consolidación de lo que ya empezaste a construir',
        'Sientes que el sistema puede ser aún más eficiente',
        'Estás listo para el último ajuste — el que hace que todo se sostenga solo',
      ],
      truth: 'El cerebro no distingue entre disciplina y placer — aprende lo que se repite con mayor frecuencia. Cuando conectas el esfuerzo con una gratificación rápida y significativa… no estás tomando un atajo. Estás diseñando el sistema para que funcione con tu neurología, no contra ella. La verdadera sabiduría está en balancear esas recompensas con una motivación interior sólida que te impulse cuando la recompensa externa no aparezca.',
      objective: 'Construir un sistema de recompensas inmediatas que refuercen tus hábitos más importantes. No desde debilidad — desde diseño inteligente. Porque los Templarios que llegan al final no son solo los más disciplinados. Son los que construyeron sistemas tan bien pensados que sostenerse se volvió lo natural.',
      keyPhrase: 'El cerebro aprende lo que repites… dales razones para repetir lo que importa.',
      reminder: 'Este es el último módulo. Tu Registro del Templario guarda la evidencia de todo lo que construiste. No es el fin del camino — es el inicio de quien ya eres. 🔥',
    },
  },
];

// ─── Tipos de módulo con metadata visual ────────────────────────────────────
export const MODULE_TYPE_CONFIG = {
  vision:   { label: 'Visión Maestra',   color: '#F5C518', icon: '👁️', rarity: 'legendary' },
  control:  { label: 'Control',          color: '#EF4444', icon: '⚔️', rarity: 'legendary' },
  influencia: { label: 'Influencia',     color: '#06B6D4', icon: '🌊', rarity: 'epic'      },
  autonomia:  { label: 'Autonomía',      color: '#10B981', icon: '🦅', rarity: 'rare'      },
  autorrealizacion: { label: 'Autorrealización', color: '#C084FC', icon: '🔥', rarity: 'uncommon' },
};

// ─── Store principal ─────────────────────────────────────────────────────────
const useMembershipStore = create(
  persist(
    (set, get) => ({
      // Estado de suscripción
      status: 'idle',          // idle | loading | active | inactive | expired
      plan: null,              // 'propotienda' | 'crecimiento' | null
      memberSince: null,       // ISO date string
      renewsAt: null,          // ISO date string
      lastValidated: null,     // timestamp de última validación
      protocoLoFecha: null,    // fecha del protocolo activo (para countdown)

      // Módulos
      openedModules: [],       // slugs que el usuario YA abrió
      completedModules: [],    // slugs completados (botón "Marcar completo")
      currentWeek: 1,          // semana activa de la membresía
      userProtocolo: null,     // protocolo activo del usuario (V1, C3, I2...)

      // ─── Acciones ──────────────────────────────────────────────────────────

      /**
       * Carga y valida la membresía desde Supabase.
       * Llama esto en App.jsx después del login exitoso.
       */
      loadMembership: async (supabaseClient, userId) => {
        set({ status: 'loading' });
        try {
          const now = new Date();

          // ── 1. Leer perfil (fuente de verdad del admin) ──────────────────
          const { data: profileData } = await supabaseClient
            .from('profiles')
            .select('membership_type, membership_expires_at, membership_status, paused_at')
            .eq('id', userId)
            .single();

          // ── 2. Leer tabla memberships (Stripe) ───────────────────────────
          const { data: membershipData } = await supabaseClient
            .from('memberships')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

          // ── 3. Leer protocolo ────────────────────────────────────────────
          const userEmail = (await supabaseClient.auth.getUser())?.data?.user?.email ?? '';
          const { data: protocoloData } = await supabaseClient
            .from('user_protocolo')
            .select('protocolo, semana, fecha')
            .eq('email', userEmail)
            .maybeSingle();

          // ── 4. Calcular status — el admin tiene prioridad ─────────────────
          let memberStatus = 'inactive';
          let plan = membershipData?.plan ?? null;
          let memberSince = membershipData?.created_at ?? null;
          let renewsAt = membershipData?.renews_at ?? null;
          let currentWeek = membershipData?.current_week ?? 1;

          const adminType = profileData?.membership_type;
          const adminExpires = profileData?.membership_expires_at
            ? new Date(profileData.membership_expires_at)
            : null;

          // VIP / PropoPass permanente (admin lo dio sin fecha de expiración)
          if (adminType === 'vip' || adminType === 'propopass') {
            if (!adminExpires || adminExpires > now) {
              memberStatus = 'active';
            } else {
              memberStatus = 'expired';
            }
          }
          // Membresía pagada por admin con fecha de expiración
          else if (adminType === 'paid' && adminExpires && adminExpires > now) {
            memberStatus = 'active';
          }
          // Membresía por referido con fecha de expiración
          else if (adminType === 'referral' && adminExpires && adminExpires > now) {
            memberStatus = 'active';
          }
          // Stripe activo (flujo normal de pago)
          else if (
            membershipData &&
            membershipData.status === 'active' &&
            membershipData.renews_at &&
            new Date(membershipData.renews_at) > now
          ) {
            memberStatus = 'active';
          }
          // Si ninguno activo → revisar pausa/bloqueo
          else {
            const pausedAt = profileData?.paused_at
              ? new Date(profileData.paused_at)
              : null;
            const profileStatus = profileData?.membership_status;

            if (profileStatus === 'paused' && pausedAt) {
              const daysPaused = (Date.now() - pausedAt.getTime()) / (1000 * 60 * 60 * 24);
              memberStatus = daysPaused > 32 ? 'locked' : 'paused';
            } else if (profileData?.membership_status === 'active' && adminExpires && adminExpires > now) {
  memberStatus = 'active';
} else if (adminType === 'free' || !adminType) {
  memberStatus = 'inactive';
            } else {
              memberStatus = 'expired';
            }
          }

          set({
            status: memberStatus,
            plan,
            memberSince,
            renewsAt,
            currentWeek,
            lastValidated: now.toISOString(),
            userProtocolo: protocoloData?.protocolo ?? null,
            protocoLoFecha: protocoloData?.fecha ?? null,
          });

          // Forzar escritura inmediata en localStorage para que
          // nuevas pestañas lean el status correcto desde el primer render
          try {
            const cached = JSON.parse(localStorage.getItem('membership-store') || '{}');
            if (cached?.state) {
              cached.state.status = memberStatus;
              localStorage.setItem('membership-store', JSON.stringify(cached));
            }
          } catch (_) {}

          return memberStatus === 'active';
        } catch (err) {
          console.error('[Templo] loadMembership falló:', err);
          set({ status: 'inactive' });
          return false;
        }
      },

      /**
       * Marca un módulo como "abierto" (visto por primera vez).
       * Se llama automáticamente al entrar a la ruta del módulo.
       */
      openModule: async (userId, slug) => {
        const { openedModules } = get();
        if (openedModules.includes(slug)) return;

        const newOpened = [...openedModules, slug];
        set({ openedModules: newOpened });

        if (userId) {
          supabase
            .from('module_progress')
            .upsert({ user_id: userId, module_slug: slug, opened_at: new Date().toISOString() })
            .then(() => {}).catch(console.error);
        }
      },

      /**
       * Marca un módulo como completado y otorga recompensas.
       */
      completeModule: async (userId, slug) => {
        const { completedModules } = get();
        if (completedModules.includes(slug)) return;

        const module = ACADEMY_MODULES.find(m => m.slug === slug);
        if (!module) return;

        set({ completedModules: [...completedModules, slug] });

        if (userId) {
          supabase
            .from('module_progress')
            .upsert({
              user_id: userId,
              module_slug: slug,
              completed_at: new Date().toISOString(),
            })
            .catch(console.error);
        }

        return { xp: module.xpReward, gems: module.gemReward };
      },

      /**
       * Sincroniza el progreso desde Supabase (al recargar página).
       */
      /**
       * Escucha cambios en user_protocolo en tiempo real.
       * Llama esto después de loadMembership().
       */
      subscribeProtocolo: (userEmail) => {
        if (!userEmail) return () => {};
        // Evitar canales duplicados
        supabase.removeChannel(
          supabase.channel('protocolo-realtime')
        );
        const channel = supabase
          .channel('protocolo-realtime')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'user_protocolo',
              filter: `email=eq.${userEmail}`,
            },
            (payload) => {
              const nuevo = payload.new;
              if (!nuevo) return;
              set({
                userProtocolo: nuevo.protocolo ?? null,
                protocoLoFecha: nuevo.fecha ?? null,
              });
            }
          )
          .subscribe();
        return () => supabase.removeChannel(channel);
      },

      syncProgress: async (userId) => {
        if (!userId) return;
        const { data } = await supabase
          .from('module_progress')
          .select('module_slug, opened_at, completed_at')
          .eq('user_id', userId);

        if (!data) return;
        set({
          openedModules: data.filter(r => r.opened_at).map(r => r.module_slug),
          completedModules: data.filter(r => r.completed_at).map(r => r.module_slug),
        });
      },

      reset: () => set({
        status: 'idle', plan: null, memberSince: null, renewsAt: null,
        lastValidated: null, openedModules: [], completedModules: [], currentWeek: 1,
        userProtocolo: null, protocoLoFecha: null,
      }),
    }),

    {
      name: 'membership-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
      status: state.status,
      plan: state.plan,
      memberSince: state.memberSince,
      renewsAt: state.renewsAt,
      currentWeek: state.currentWeek,
      userProtocolo: state.userProtocolo,
      openedModules: state.openedModules,
      completedModules: state.completedModules,
    }),
    }
  )
);

// ─── Selectores optimizados ──────────────────────────────────────────────────
// Úsalos en componentes para evitar re-renders innecesarios.

/** ¿El usuario tiene membresía activa? */
export const selectIsMember = (state) => state.status === 'active';

/** ¿El usuario puede acceder a un slug específico? */
export const selectHasAccessTo = (slug) => (state) => {
  if (state.status !== 'active') return false;
  const module = ACADEMY_MODULES.find(m => m.slug === slug);
  if (!module) return false;
  if (state.userProtocolo) {
    return module.protocolo === state.userProtocolo;
  }
  return module.week <= state.currentWeek;
};

/** Lista de módulos ya abiertos (para la vista de "ya vistos") */
export const selectOpenedModules = (state) => state.openedModules;

/** Módulo de la semana actual */
export const selectCurrentModule = (state) => {
  if (state.userProtocolo) {
    return ACADEMY_MODULES.find(m => m.protocolo === state.userProtocolo) ?? ACADEMY_MODULES[0];
  }
  return ACADEMY_MODULES.find(m => m.week === state.currentWeek) ?? ACADEMY_MODULES[0];
};

/** Progreso general: porcentaje completado */
export const selectProgress = (state) => {
  const total = ACADEMY_MODULES.length;
  const done = state.openedModules.length;
  return total > 0 ? Math.round((done / total) * 100) : 0;
};

export default useMembershipStore;