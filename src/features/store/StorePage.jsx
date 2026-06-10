import { useState, useEffect, useRef, useCallback } from 'react';
import ActivateToolButton from './ActivateToolButton';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import { supabase } from '../../services/supabase';
import { missionsService } from '../../services/missions.service';
import UnlockCinematic from '../../components/ui/UnlockCinematic';
import TStoreTutorial from './TStoreTutorial';


// ─────────────────────────────────────────────
//  SPHERE / TERRITORY DATA
// ─────────────────────────────────────────────
const SPHERES = [
  { idx: 0, icon: '🧠', color: '#60a5fa', label: 'Mente',          territory: 'mente' },
  { idx: 1, icon: '💪', color: '#ef4444', label: 'Cuerpo',         territory: 'cuerpo' },
  { idx: 2, icon: '🌴', color: '#f97316', label: 'Ocio',           territory: 'ocio' },
  { idx: 3, icon: '🪷', color: '#06b6d4', label: 'Espiritualidad', territory: 'espiritualidad' },
  { idx: 4, icon: '🎯', color: '#8b5cf6', label: 'Vocación',       territory: 'vocacion' },
  { idx: 5, icon: '👥', color: '#22c55e', label: 'Relaciones',     territory: 'relaciones' },
  { idx: 6, icon: '💰', color: '#eab308', label: 'Finanzas',       territory: 'finanzas' },
  { idx: 7, icon: '💗', color: '#ec4899', label: 'Emociones',      territory: 'emociones' },
];

const TERRITORY_MAP = Object.fromEntries(SPHERES.map(s => [s.territory, s]));

// ─────────────────────────────────────────────
//  DEEP TERRITORY KNOWLEDGE
// ─────────────────────────────────────────────
const TERRITORY_DEEP = {
  mente: {
    number: '02',
    title: 'MENTE',
    subtitle: 'La Arquitectura del Pensamiento',
    symbol: '🧠',
    color: '#60a5fa',
    essence: 'La mente no es solo donde piensas — es el filtro a través del cual experimentas toda tu realidad. Cada creencia que tienes, cada historia que te cuentas, cada patrón que repites: todo eso es arquitectura mental. Y esa arquitectura determina qué ves como posible.',
    role: 'La Mente es el territorio que amplifica o contamina todos los demás. Una mente clara expande la Vocación, estabiliza las Emociones y genera claridad en las Finanzas. Una mente en caos convierte oportunidades en amenazas y obstáculos en muros.',
    lifeImpact: 'Cuando este territorio está activo, tus decisiones se vuelven precisas, tu aprendizaje se acelera y encuentras soluciones donde antes solo veías problemas. La niebla desaparece. Operas desde claridad real, no desde reactividad.',
    symbolMeaning: 'El cerebro como símbolo representa el poder de re-arquitecturar el pensamiento. Los ejercicios de Mente usan el azul porque el azul evoca profundidad cognitiva, claridad y expansión — el color del cielo sin límites y del océano sin fondo.',
    colorMeaning: 'El AZUL de la Mente es deliberado. El azul calma el sistema nervioso mientras activa la corteza prefrontal — la parte del cerebro que piensa con claridad. Es el color que tu mente necesita para operar desde su mejor versión.',
    exercises: ['Protocolos de journaling cognitivo', 'Técnicas de reprogramación de creencias', 'Mapas mentales y arquitectura del pensamiento', 'Meditaciones de claridad y enfoque', 'Sistemas de aprendizaje acelerado'],
    connections: [
      { territory: 'cuerpo', icon: '💪', label: 'Cuerpo', color: '#ef4444', desc: 'La fatiga física genera directamente niebla mental. Cuerpo y mente son un sistema único.' },
      { territory: 'emociones', icon: '💗', label: 'Emociones', color: '#ec4899', desc: 'Tus pensamientos generan tus emociones. Una mente clara produce estados emocionales más estables.' },
      { territory: 'vocacion', icon: '🎯', label: 'Vocación', color: '#8b5cf6', desc: 'La mente define qué crees posible en tu vocación. El techo de tu propósito es mental.' },
    ],
    unlocks: 'Dominar la Mente desbloquea acceso a Mapas Mentales avanzados, técnicas cognitivas de alto rendimiento y la capacidad de reprogramar cualquier creencia que te limita.',
    mastery: ['Decisiones más rápidas y precisas', 'Aprendizaje acelerado en cualquier área', 'Menos ruido mental, más claridad', 'Creatividad expandida y enfoque profundo', 'Resistencia mental ante la adversidad'],
    collapse: 'Cuando la Mente colapsa, el ruido mental bloquea la creatividad y genera indecisión crónica. La persona siente que está "atrapada" aunque las circunstancias externas sean favorables. La parálisis por análisis se instala. Todo se siente más difícil de lo que realmente es.',
    warning: 'Una mente no entrenada contamina silenciosamente todos los demás territorios.',
  },
  cuerpo: {
    number: '01',
    title: 'CUERPO',
    subtitle: 'El Combustible Base del Sistema',
    symbol: '💪',
    color: '#ef4444',
    essence: 'Tu energía física no es un lujo — es la plataforma sobre la que opera todo lo demás. Sin cuerpo funcional, la mente se nubla, las emociones se desregulan y la capacidad de ejecutar en tu Vocación cae. El Cuerpo es el primer territorio que el Templo activa porque sin él, los demás no pueden sostener su potencial.',
    role: 'El Cuerpo es el territorio base del sistema. Sostiene a todos los demás. Cuando tu energía física está alta, tienes más capacidad mental, más estabilidad emocional y más productividad sostenida. No es vanidad — es infraestructura.',
    lifeImpact: 'Cuando activas este territorio, la diferencia no es solo física. Tu mente piensa con mayor claridad, tu estado emocional se estabiliza naturalmente y tu capacidad de ejecutar en lo que importa se multiplica. El cuerpo bien mantenido es energía que fluye hacia todo lo demás.',
    symbolMeaning: 'El símbolo de fuerza representa vitalidad activa — no perfección física sino energía disponible. Los ejercicios del Cuerpo son el fundamento porque sin energía física nada puede sostenerse en el tiempo.',
    colorMeaning: 'El ROJO del Cuerpo es el color de la sangre, el fuego y la acción. Es el color de la vitalidad primaria — la energía más directa y concreta del sistema. Rojo activa, moviliza y despierta.',
    exercises: ['Protocolos de activación física progresiva', 'Rutinas de movimiento intencional', 'Sistemas de respiración y energía', 'Nutrición y hábitos de restauración', 'Hidratación y ritmos circadianos'],
    connections: [
      { territory: 'mente', icon: '🧠', label: 'Mente', color: '#60a5fa', desc: 'Cuerpo y mente son un sistema. La energía física alimenta directamente la claridad cognitiva.' },
      { territory: 'emociones', icon: '💗', label: 'Emociones', color: '#ec4899', desc: 'El cuerpo agotado desregula la respuesta emocional. El movimiento físico regula el sistema emocional.' },
      { territory: 'finanzas', icon: '💰', label: 'Finanzas', color: '#eab308', desc: 'Sin energía física sostenida, la productividad cae — y con ella la capacidad de generar abundancia.' },
    ],
    unlocks: 'Dominar el Cuerpo desbloquea protocolos de alto rendimiento físico, sistemas de restauración profunda y el Mapa Corporal completo con sus 8 sistemas de optimización.',
    mastery: ['Energía sostenida durante todo el día', 'Sueño profundo y reparador', 'Mayor capacidad de concentración', 'Reducción del estrés físico y mental', 'Vitalidad que se mantiene con los años'],
    collapse: 'La fatiga crónica genera niebla mental, irritabilidad emocional y pérdida de productividad sostenida. Todo el sistema del Templo opera en modo supervivencia — apagando lo que no sea urgente. El agotamiento físico es silencioso hasta que se vuelve imposible de ignorar.',
    warning: 'Sin base física sólida, todos los demás territorios operan en déficit energético.',
  },
  ocio: {
    number: '08',
    title: 'OCIO',
    subtitle: 'El Combustible Oculto del Sistema',
    symbol: '🌴',
    color: '#f97316',
    essence: 'El Ocio es el territorio más mal interpretado del Templo. No es el opuesto del trabajo — es su combustible. No es tiempo perdido — es el espacio donde el sistema se recarga, la creatividad se renueva y la persona recuerda quién es más allá de su función. Sin ocio genuino, todo lo demás se quema.',
    role: 'El Ocio actúa como regulador del sistema completo. Cuando está presente, la productividad de la Vocación se sostiene, las Relaciones se nutren con presencia real y la Espiritualidad encuentra espacio para respirar. Es invisible cuando funciona y devastador cuando falta.',
    lifeImpact: 'Cuando dominas el Ocio, descubres que descansar bien multiplica tu capacidad de actuar. Tu creatividad se dispara. Tu presencia en las relaciones mejora. Aparece una dimensión de ti que no existía cuando estabas en modo ejecución permanente.',
    symbolMeaning: 'La palmera representa descanso genuino, presencia en el momento y la sabiduría de saber cuándo parar. Los ejercicios de Ocio llevan este símbolo para recordar que el descanso es una práctica que se aprende.',
    colorMeaning: 'El NARANJA del Ocio es el color del atardecer, del fuego que calienta sin quemar y de la energía lúdica. Naranja es creatividad, calidez y juego — la energía del Ocio que restaura sin exigir.',
    exercises: ['Protocolos de descanso activo y restauración', 'Práctica del juego consciente', 'Rutinas nocturnas de recuperación profunda', 'Técnicas de desconexión digital', 'Actividades de flujo y disfrute puro'],
    connections: [
      { territory: 'cuerpo', icon: '💪', label: 'Cuerpo', color: '#ef4444', desc: 'El descanso físico genuino es la base del Ocio real. Cuerpo y Ocio son inseparables.' },
      { territory: 'relaciones', icon: '👥', label: 'Relaciones', color: '#22c55e', desc: 'El ocio compartido crea vínculos más profundos que cualquier conversación seria.' },
      { territory: 'espiritualidad', icon: '🪷', label: 'Espiritualidad', color: '#06b6d4', desc: 'El juego genuino es una forma de presencia espiritual — existir sin agenda.' },
    ],
    unlocks: 'Dominar el Ocio desbloquea protocolos de restauración premium, el arte del descanso activo y la capacidad de recuperar energía de forma profunda y sostenible.',
    mastery: ['Energía renovada de forma genuina', 'Creatividad que fluye sin esfuerzo', 'Presencia real en cada momento', 'Equilibrio vital entre acción y reposo', 'Capacidad de disfrutar sin culpa'],
    collapse: 'El sobrerendimiento sin recuperación lleva al burnout. La persona sin Ocio genuino no descansa — solo cambia de tarea. El sistema colapsa silenciosamente hasta que ya no puede sostenerse. La creatividad se apaga, las relaciones sufren y la vocación se convierte en carga.',
    warning: 'La persona que no descansa no elige — reacciona. El Ocio no es opcional.',
  },
  espiritualidad: {
    number: '07',
    title: 'ESPIRITUALIDAD',
    subtitle: 'El Ancla del Sistema',
    symbol: '🪷',
    color: '#06b6d4',
    essence: 'La Espiritualidad en el Templo no es necesariamente religión. Es tu conexión con algo más grande que el ego — propósito, valores profundos, presencia consciente, sentido. Es el territorio que da significado cuando los resultados externos no alcanzan y que sostiene cuando todo lo demás falla.',
    role: 'La Espiritualidad es el ancla del sistema. Sin ella, el éxito se siente vacío y el fracaso se vuelve identidad. Es el territorio más ignorado — y el que más silenciosamente hace falta. Es el primero que se abandona cuando la vida se acelera y el último que se recupera.',
    lifeImpact: 'Cuando este territorio está activo, hay una calma que no depende de las circunstancias externas. Las crisis no te rompen — las atraviesas. El éxito se celebra sin obsesión. El fracaso se integra sin tragedia. Hay un hilo interno que sostiene todo.',
    symbolMeaning: 'La flor de loto representa transformación desde la profundidad — crece desde el barro hacia la luz. Los ejercicios de Espiritualidad llevan este símbolo porque el crecimiento espiritual siempre ocurre desde los lugares más difíciles hacia los más luminosos.',
    colorMeaning: 'El CIAN de la Espiritualidad es el color del agua profunda y del cielo en expansión. Es un color que evoca tanto profundidad como apertura — exactamente la cualidad del territorio espiritual: raíces profundas y horizontes ilimitados.',
    exercises: ['Prácticas de meditación y presencia', 'Exploración de valores y propósito profundo', 'Rituales de conexión y gratitud', 'Diario espiritual y reflexión contemplativa', 'Técnicas de mindfulness integrado en la vida'],
    connections: [
      { territory: 'emociones', icon: '💗', label: 'Emociones', color: '#ec4899', desc: 'La práctica espiritual regula profundamente el estado emocional. La paz interior viene de aquí.' },
      { territory: 'vocacion', icon: '🎯', label: 'Vocación', color: '#8b5cf6', desc: 'El propósito espiritual da dirección auténtica a la vocación — la diferencia entre un trabajo y una misión.' },
      { territory: 'ocio', icon: '🌴', label: 'Ocio', color: '#f97316', desc: 'El descanso consciente es una práctica espiritual — existir sin agenda es una forma de presencia.' },
    ],
    unlocks: 'Dominar la Espiritualidad desbloquea el acceso al núcleo más profundo del sistema del Templo: la capacidad de crear desde el ser, no solo desde el hacer.',
    mastery: ['Paz profunda que no depende del exterior', 'Claridad de propósito en cada decisión', 'Resiliencia ante la adversidad', 'Presencia total en el momento', 'Sentido profundo de la vida'],
    collapse: 'Sin ancla espiritual el éxito se vacía, los fracasos se convierten en identidad y la vida pierde el hilo que la sostiene. La persona puede tenerlo todo externamente y sentir un vacío que no comprende. Es el territorio más urgente que se ignora.',
    warning: 'Sin raíces espirituales, el éxito externo no alcanza para llenar lo que falta adentro.',
  },
  vocacion: {
    number: '06',
    title: 'VOCACIÓN',
    subtitle: 'El Centro Organizador del Sistema',
    symbol: '🎯',
    color: '#8b5cf6',
    essence: 'Tu Vocación es la contribución única que puedes hacer al mundo — lo que haces que tiene sentido más allá del ingreso. No es solo un trabajo o una carrera. Es el territorio donde el propósito se vuelve acción concreta y donde tu energía más auténtica se activa.',
    role: 'La Vocación es el territorio central del Templo. Cuando está activa y alineada, todos los demás encuentran dirección. La Mente sabe hacia dónde apuntar. Las Finanzas encuentran propósito. Las Relaciones se enriquecen con significado compartido.',
    lifeImpact: 'Cuando este territorio está vivo, la motivación no es un problema. Actúas desde un lugar de energía genuina, no de obligación. Tu trabajo deja de sentirse como trabajo. El tiempo pasa diferente. Las dificultades no te detienen — te enseñan.',
    symbolMeaning: 'El objetivo/diana representa precisión y dirección — no dispersión sino enfoque. Los ejercicios de Vocación usan este símbolo porque activar la vocación requiere claridad de dirección antes que velocidad de acción.',
    colorMeaning: 'El VIOLETA de la Vocación es el color del propósito y la profundidad. Es el color más complejo del espectro — mezcla de la acción del rojo y la quietud del azul. La Vocación requiere ambas energías: pasión y claridad.',
    exercises: ['Mapas de propósito y contribución', 'Sistemas de alineación entre valores y acción', 'Diseño de visión de vida a 10 años', 'Estrategias de ejecución desde el propósito', 'Protocolos de toma de decisiones vocacionales'],
    connections: [
      { territory: 'mente', icon: '🧠', label: 'Mente', color: '#60a5fa', desc: 'La claridad mental es necesaria para identificar y ejecutar la vocación con precisión.' },
      { territory: 'finanzas', icon: '💰', label: 'Finanzas', color: '#eab308', desc: 'La vocación alineada genera abundancia sostenible — el dinero fluye hacia donde hay contribución real.' },
      { territory: 'espiritualidad', icon: '🪷', label: 'Espiritualidad', color: '#06b6d4', desc: 'Una vocación con profundidad espiritual trasciende el ego y crea impacto real.' },
    ],
    unlocks: 'Dominar la Vocación desbloquea el Mapa Maestro del Templo, acceso a sesiones de coaching de propósito y herramientas de diseño de vida que integran todos los territorios.',
    mastery: ['Motivación intrínseca permanente', 'Trabajo que se siente como contribución', 'Claridad total sobre la dirección de vida', 'Energía sostenida sin burnout', 'Impacto real y medible en el mundo'],
    collapse: 'El trabajo sin sentido genera un vacío que ningún ingreso puede llenar. La persona trabaja, planea, ejecuta — pero hay una sensación persistente de que algo no encaja. El Templo llama a esto vivir desalineado. Es el colapso más silencioso y más común.',
    warning: 'Ejecutar sin propósito es el camino más eficiente hacia el vacío.',
  },
  relaciones: {
    number: '04',
    title: 'RELACIONES',
    subtitle: 'El Ecosistema que Forma tu Realidad',
    symbol: '👥',
    color: '#22c55e',
    essence: 'Las Relaciones son el ecosistema humano que te rodea — familia, amigos, pareja, equipo, comunidad. No es solo la calidad de los vínculos que tienes, sino cómo ese entorno retroalimenta quién crees que eres y qué crees que es posible para ti.',
    role: 'Las Relaciones definen el techo de lo que crees posible. El entorno humano es el territorio más subestimado del sistema — actúa silenciosamente, formando creencias e identidad sin que lo notes. Eres, en parte, el promedio de las personas con las que pasas tiempo.',
    lifeImpact: 'Cuando este territorio florece, tienes una red que te sostiene cuando caes, que te celebra cuando avanzas y que te desafía a crecer cuando te estancas. No estás solo en el camino. Hay una tribu que comparte la dirección.',
    symbolMeaning: 'Las personas como símbolo representan la tribu — ese ecosistema humano que es fuente de energía, perspectiva y posibilidad. Los ejercicios de Relaciones usan este símbolo porque la inteligencia relacional es una habilidad que se desarrolla, no un rasgo fijo.',
    colorMeaning: 'El VERDE de las Relaciones es el color de la vida, el crecimiento y la conexión orgánica. El verde es el color de los ecosistemas vivos — exactamente lo que son las relaciones cuando están bien cultivadas: sistemas vivos que crecen con atención.',
    exercises: ['Mapas del ecosistema relacional', 'Técnicas de comunicación profunda y efectiva', 'Protocolos de construcción de tribu intencional', 'Herramientas de resolución de conflictos', 'Sistemas de fortalecimiento de vínculos'],
    connections: [
      { territory: 'emociones', icon: '💗', label: 'Emociones', color: '#ec4899', desc: 'El estado emocional define la calidad de los vínculos. Relaciones sanas regulan las emociones.' },
      { territory: 'finanzas', icon: '💰', label: 'Finanzas', color: '#eab308', desc: 'La red relacional abre o cierra oportunidades económicas — el capital social es real.' },
      { territory: 'ocio', icon: '🌴', label: 'Ocio', color: '#f97316', desc: 'El ocio compartido crea vínculos más profundos que cualquier conversación seria.' },
    ],
    unlocks: 'Dominar las Relaciones desbloquea acceso a la Comunidad del Templo, el Mapa Relacional completo y herramientas de inteligencia social que transforman cada vínculo.',
    mastery: ['Vínculos profundos y auténticos', 'Comunicación que conecta de verdad', 'Red de apoyo sólida y recíproca', 'Sentido de pertenencia genuino', 'Expansión colectiva — todos crecen juntos'],
    collapse: 'El aislamiento o las relaciones tóxicas drenan energía de todos los demás territorios. No hay ser humano que pueda operar bien en soledad prolongada o rodeado de entornos crónicamente negativos. Las relaciones dañinas son el freno invisible más poderoso del sistema.',
    warning: 'No puedes crecer más allá del techo que establece tu entorno humano.',
  },
  finanzas: {
    number: '05',
    title: 'FINANZAS',
    subtitle: 'La Libertad que Potencia Todo lo Demás',
    symbol: '💰',
    color: '#eab308',
    essence: 'Las Finanzas en el Templo no son el fin del camino — son el combustible que da libertad a los demás territorios. No se trata solo del dinero que tienes, sino de cómo lo piensas, lo generas, lo administras y qué libertad de elección te da ese estado.',
    role: 'La abundancia económica es el territorio que más se tergiversa. No es el objetivo del sistema — es lo que permite que los otros operen sin presión constante. Sin base financiera sólida, las decisiones de propósito se convierten en decisiones de supervivencia.',
    lifeImpact: 'Cuando este territorio está activo, el dinero deja de ser una fuente de ansiedad y se convierte en una herramienta. Puedes invertir en tu Vocación, en tu Cuerpo, en tus Relaciones. La libertad económica expande todos los territorios simultáneamente.',
    symbolMeaning: 'El símbolo de abundancia representa no solo dinero sino el flujo — la energía económica que se genera, circula y regresa. Los ejercicios de Finanzas llevan este símbolo para transformar la relación con la abundancia desde adentro.',
    colorMeaning: 'El ORO de las Finanzas es deliberado — no es el amarillo del miedo sino el dorado de la abundancia real. Es el color del sol que nutre, del valor que perdura y de la prosperidad que se construye con intención.',
    exercises: ['Rituales financieros de abundancia', 'Sistemas de gestión y flujo de dinero', 'Estrategias de generación de múltiples fuentes', 'Reprogramación de creencias sobre el dinero', 'Arquitectura de patrimonio consciente'],
    connections: [
      { territory: 'vocacion', icon: '🎯', label: 'Vocación', color: '#8b5cf6', desc: 'La vocación bien ejecutada genera abundancia real y sostenible — propósito y prosperidad se alinean.' },
      { territory: 'cuerpo', icon: '💪', label: 'Cuerpo', color: '#ef4444', desc: 'El estrés económico crónico daña físicamente el cuerpo. La libertad financiera libera energía vital.' },
      { territory: 'relaciones', icon: '👥', label: 'Relaciones', color: '#22c55e', desc: 'La abundancia abre oportunidades relacionales — y también revela la calidad de los vínculos.' },
    ],
    unlocks: 'Dominar las Finanzas desbloquea el Mapa Financiero completo, simuladores de abundancia y sistemas de generación de riqueza que se integran con tu propósito.',
    mastery: ['Libertad de elección real en la vida', 'Mentalidad de abundancia instalada', 'Flujo de dinero expansivo y sostenible', 'Eliminación del estrés económico crónico', 'Patrimonio que crece con intención'],
    collapse: 'La escasez económica genera estrés crónico que contamina mente, cuerpo y relaciones. Convierte decisiones de propósito en decisiones de supervivencia — y hace imposible pensar a largo plazo. La ansiedad financiera es uno de los mayores inhibidores del potencial humano.',
    warning: 'La escasez económica convierte cada decisión en una decisión de supervivencia.',
  },
  emociones: {
    number: '03',
    title: 'EMOCIONES',
    subtitle: 'El Puente entre lo Interno y lo Externo',
    symbol: '💗',
    color: '#ec4899',
    essence: 'Las Emociones no son el problema — son información. El territorio emocional es tu capacidad de sentir, procesar y gestionar estados internos. El problema no son las emociones en sí: es cuando esa información toma el control de tus decisiones sin que lo elijas.',
    role: 'Las Emociones son el puente entre tu mundo interno y tus relaciones externas. Una emocionalidad bien gestionada permite conectar profundamente y decidir con claridad. Sin gestión emocional, el territorio contamina todo lo que toca — especialmente las Relaciones y la Vocación.',
    lifeImpact: 'Cuando dominas este territorio, tienes acceso a toda la riqueza de tu mundo emocional sin ser gobernado por él. Puedes sentir plenamente y decidir claramente. Tus relaciones se profundizan. Tu bienestar deja de depender de las circunstancias externas.',
    symbolMeaning: 'El corazón como símbolo representa no sentimentalismo sino inteligencia emocional — la sabiduría que viene de saber sentir y procesar. Los ejercicios de Emociones llevan este símbolo porque el corazón inteligente es la fuente de las mejores decisiones.',
    colorMeaning: 'El ROSA INTENSO de las Emociones es el color del corazón en acción — ni el rojo de la agresión ni el suave de la pasividad. Es el rosa de la emocionalidad madura: presente, expresiva y gestionada.',
    exercises: ['Protocolos de procesamiento emocional', 'Técnicas de regulación del estado interno', 'Diario emocional guiado y reflexivo', 'Desarrollo de inteligencia emocional', 'Herramientas de transformación de estados'],
    connections: [
      { territory: 'relaciones', icon: '👥', label: 'Relaciones', color: '#22c55e', desc: 'El estado emocional define completamente la calidad de los vínculos que construyes.' },
      { territory: 'mente', icon: '🧠', label: 'Mente', color: '#60a5fa', desc: 'Las emociones no procesadas crean ruido mental. Mente y emociones son sistemas interconectados.' },
      { territory: 'espiritualidad', icon: '🪷', label: 'Espiritualidad', color: '#06b6d4', desc: 'La paz emocional nutre la conexión espiritual — el corazón quieto escucha más profundo.' },
    ],
    unlocks: 'Dominar las Emociones desbloquea el Portal Emocional completo, técnicas de transformación de estados y el mapa de tu mundo emocional interno.',
    mastery: ['Estabilidad emocional genuina', 'Decisiones menos reactivas y más sabias', 'Relaciones más profundas y auténticas', 'Bienestar que no depende del exterior', 'Acceso a estados emocionales elevados'],
    collapse: 'Las reacciones emocionales no gestionadas destruyen relaciones, bloquean decisiones clave y crean ciclos de sabotaje que se repiten sin importar el entorno externo. Es el territorio que más se autosabotea — y el que más se niega.',
    warning: 'Las emociones sin gestión no desaparecen — encuentran otra salida, generalmente destructiva.',
  },
};

// ─────────────────────────────────────────────
//  TAB SYSTEM
// ─────────────────────────────────────────────
const TABS = [
  { id: 'todo',      label: 'TODO' },
  { id: 'claves',    label: 'CLAVES' },
  { id: 'victorias', label: 'VICTORIAS RÁPIDAS' },
  { id: 'mapas',     label: 'MAPAS DEL TEMPLO' },
];

const TAB_CORE_TEXT = {
  todo:      'TODO',
  claves:    'CLAVES',
  victorias: 'VICTORIAS\nRÁPIDAS',
  mapas:     'MAPAS DEL\nTEMPLO',
};

const TAB_STYLES = {
  todo:      { color: '#E2E8F0', rgb: '226,232,240', icon: '✦',  glow: 'rgba(226,232,240,0.55)', activeText: '#F8FAFF',  hoverBg: 'rgba(226,232,240,0.12)' },
  claves:    { color: '#F59E0B', rgb: '245,159,11',  icon: '🗝',  glow: 'rgba(245,159,11,0.7)',   activeText: '#FDE68A',  hoverBg: 'rgba(245,159,11,0.12)' },
  victorias: { color: '#10B981', rgb: '16,185,129',  icon: '⚡',  glow: 'rgba(16,185,129,0.7)',   activeText: '#6EE7B7',  hoverBg: 'rgba(16,185,129,0.12)' },
  mapas:     { color: '#8B5CF6', rgb: '139,92,246',  icon: '🗺',  glow: 'rgba(139,92,246,0.7)',   activeText: '#C4B5FD',  hoverBg: 'rgba(139,92,246,0.12)' },
};

const CATEGORY_CONFIG = {
  claves:    { label: 'Clave',           icon: '🗝', color: '#F59E0B', bg: 'rgba(245,159,11,0.18)',   border: 'rgba(245,159,11,0.65)',   text: '#FDE68A',  glow: '245,159,11',  shadow: 'rgba(245,159,11,0.9)' },
  victorias: { label: 'Victoria Rápida', icon: '⚡', color: '#10B981', bg: 'rgba(16,185,129,0.18)',   border: 'rgba(16,185,129,0.65)',   text: '#6EE7B7',  glow: '16,185,129',  shadow: 'rgba(16,185,129,0.9)' },
  mapas:     { label: 'Mapa del Templo', icon: '🗺', color: '#8B5CF6', bg: 'rgba(139,92,246,0.18)',   border: 'rgba(139,92,246,0.65)',   text: '#C4B5FD',  glow: '139,92,246',  shadow: 'rgba(139,92,246,0.9)' },
  todo:      { label: 'General',         icon: '✦', color: '#E8D5A3', bg: 'rgba(232,213,163,0.15)',  border: 'rgba(232,213,163,0.55)',  text: '#FDF5DC',  glow: '232,213,163', shadow: 'rgba(232,213,163,0.8)' },
};

// ─────────────────────────────────────────────
//  DEMO MODULE DATA
// ─────────────────────────────────────────────
const DEMO_MODULES = {
  todo: [
    { id: 1,  title: 'Activación Semanal',  subtitle: 'Territorio del Cuerpo',   category: 'victorias', territory: 'cuerpo',        image: null, color: '#ef4444', propocoins: 500,
      description: 'Un protocolo de 7 días para despertar la energía física dormida. Activa cada célula de tu cuerpo con movimiento intencional y respiración consciente.',
      objectives: ['Establecer una rutina física diaria', 'Aumentar niveles de energía', 'Conectar mente y cuerpo'],
      rewards: ['500 puntos de experiencia', 'Insignia: Guerrero del Cuerpo', 'Acceso al Mapa Corporal Avanzado'],
      benefits: ['Más energía durante el día', 'Mejor sueño', 'Mayor claridad mental', 'Reducción de estrés'] },
    { id: 2,  title: 'Mapa de Decisiones',  subtitle: 'Propósito Central',       category: 'mapas',     territory: 'vocacion',       image: null, color: '#8b5cf6', propocoins: 800,
      description: 'Navega el sistema de decisiones que define tu propósito de vida. Este mapa te guía a través de las encrucijadas fundamentales para encontrar tu dirección verdadera.',
      objectives: ['Clarificar valores fundamentales', 'Identificar tu norte magnético', 'Construir un plan de vida coherente'],
      rewards: ['800 puntos de experiencia', 'Insignia: Navegante del Propósito', 'Acceso a Sesión Premium'],
      benefits: ['Decisiones más claras', 'Alineación entre acción y propósito', 'Paz interior', 'Dirección enfocada'] },
    { id: 3,  title: 'Código de la Mente',  subtitle: 'Territorio Mental',       category: 'claves',    territory: 'mente',          image: null, color: '#60a5fa', propocoins: 600,
      description: 'Descifra los patrones de pensamiento que construyen tu realidad. Aprende a reprogramar tu mente para operar desde un estado de máximo rendimiento.',
      objectives: ['Identificar creencias limitantes', 'Instalar patrones mentales expansivos', 'Desarrollar disciplina cognitiva'],
      rewards: ['600 puntos de experiencia', 'Insignia: Arquitecto Mental', 'Libro digital: Código Cognitivo'],
      benefits: ['Pensamiento más claro', 'Menos ruido mental', 'Mayor enfoque', 'Creatividad ampliada'] },
    { id: 4,  title: 'Ritual Financiero',   subtitle: 'Finanzas y Abundancia',   category: 'claves',    territory: 'finanzas',       image: null, color: '#eab308', propocoins: 700,
      description: 'Transforma tu relación con el dinero a través de rituales diarios de abundancia. Activa el flujo financiero desde adentro hacia afuera.',
      objectives: ['Sanar la relación con el dinero', 'Crear hábitos de prosperidad', 'Abrir canales de abundancia'],
      rewards: ['700 puntos de experiencia', 'Insignia: Guardián de la Abundancia', 'Tracker financiero premium'],
      benefits: ['Mentalidad de abundancia', 'Mejores decisiones financieras', 'Reducción de ansiedad económica', 'Claridad con el dinero'] },
    { id: 5,  title: 'Corazón Tribal',      subtitle: 'Relaciones y Vínculos',   category: 'victorias', territory: 'relaciones',     image: null, color: '#22c55e', propocoins: 550,
      description: 'Activa el poder de la tribu. Aprende a construir vínculos profundos y genuinos que potencien tu vida y la de quienes te rodean.',
      objectives: ['Fortalecer vínculos existentes', 'Atraer relaciones de calidad', 'Desarrollar inteligencia relacional'],
      rewards: ['550 puntos de experiencia', 'Insignia: Tejedor de Tribus', 'Acceso a la Comunidad del Templo'],
      benefits: ['Relaciones más profundas', 'Comunicación efectiva', 'Sentido de pertenencia', 'Red de apoyo sólida'] },
    { id: 6,  title: 'Portal Emocional',    subtitle: 'Inteligencia Emocional',  category: 'mapas',     territory: 'emociones',      image: null, color: '#ec4899', propocoins: 650,
      description: 'Abre el portal hacia tu mundo emocional. Aprende a navegar tus emociones con maestría en lugar de ser gobernado por ellas.',
      objectives: ['Desarrollar autoconciencia emocional', 'Gestionar emociones difíciles', 'Cultivar estados emocionales elevados'],
      rewards: ['650 puntos de experiencia', 'Insignia: Maestro Emocional', 'Diario emocional guiado'],
      benefits: ['Mayor estabilidad emocional', 'Mejores relaciones', 'Decisiones menos reactivas', 'Bienestar profundo'] },
  ],
  claves: [
    { id: 7,  title: 'Clave del Despertar', subtitle: 'Consciencia Expandida',   category: 'claves', territory: 'espiritualidad', image: null, color: '#06b6d4', propocoins: 900,
      description: 'La primera clave del sistema: despertar a tu naturaleza más profunda. Un viaje de exploración espiritual que transforma la percepción de la realidad.',
      objectives: ['Iniciar práctica de meditación', 'Explorar la dimensión espiritual', 'Conectar con el ser esencial'],
      rewards: ['900 puntos de experiencia', 'Insignia: Despertado', 'Acceso a Retiro Virtual'],
      benefits: ['Paz profunda', 'Conexión espiritual', 'Mayor presencia', 'Experiencias trascendentes'] },
    { id: 8,  title: 'Clave del Ocio',      subtitle: 'Descanso Consciente',     category: 'claves', territory: 'ocio',           image: null, color: '#f97316', propocoins: 450,
      description: 'Descubre que el descanso es una habilidad sagrada. Aprende a recargar energía de manera profunda y a integrar el juego en tu vida cotidiana.',
      objectives: ['Dominar el arte del descanso', 'Eliminar culpa por descansar', 'Crear ritmos de trabajo y juego'],
      rewards: ['450 puntos de experiencia', 'Insignia: Maestro del Ocio', 'Playlist de restauración'],
      benefits: ['Más energía', 'Mejor rendimiento', 'Mayor creatividad', 'Equilibrio vital'] },
    { id: 9,  title: 'Clave del Propósito', subtitle: 'Dirección de Vida',       category: 'claves', territory: 'vocacion',       image: null, color: '#8b5cf6', propocoins: 1000,
      description: 'La clave maestra: encontrar y activar tu propósito de vida. Un proceso profundo de autodescubrimiento que alinea cada área de tu existencia.',
      objectives: ['Descubrir la misión de vida', 'Alinear vocación y acción', 'Crear una visión de 10 años'],
      rewards: ['1000 puntos de experiencia', 'Insignia: Portador del Propósito', 'Sesión de coaching 1:1'],
      benefits: ['Claridad total', 'Motivación intrínseca', 'Vida con sentido', 'Enfoque inquebrantable'] },
    { id: 10, title: 'Clave Financiera',    subtitle: 'Abundancia Activada',     category: 'claves', territory: 'finanzas',       image: null, color: '#eab308', propocoins: 850,
      description: 'Activa el sistema financiero de tu vida. Una clave que desbloquea el flujo de prosperidad y transforma tu relación con la abundancia.',
      objectives: ['Crear múltiples fuentes de ingreso', 'Dominar el flujo de dinero', 'Construir patrimonio consciente'],
      rewards: ['850 puntos de experiencia', 'Insignia: Activador de Abundancia', 'Plan financiero personalizado'],
      benefits: ['Libertad financiera', 'Seguridad económica', 'Flujo de dinero expansivo', 'Legado material'] },
  ],
  victorias: [
    { id: 11, title: 'Victoria: Cuerpo',    subtitle: '7 días de activación',    category: 'victorias', territory: 'cuerpo',     image: null, color: '#ef4444', propocoins: 300,
      description: 'Una victoria rápida de 7 días para despertar el cuerpo dormido. Pequeñas acciones consistentes que crean una transformación física visible.',
      objectives: ['Completar rutina diaria de 20 min', 'Hidratación consciente', 'Registro de energía'],
      rewards: ['300 puntos de experiencia', 'Insignia: Cuerpo Despertado', 'Acceso al siguiente nivel'],
      benefits: ['Cuerpo activado', 'Energía renovada', 'Hábito físico instalado', 'Confianza corporal'] },
    { id: 12, title: 'Victoria: Mente',     subtitle: 'Claridad mental',         category: 'victorias', territory: 'mente',      image: null, color: '#60a5fa', propocoins: 280,
      description: 'Limpieza mental de 5 días. Técnicas probadas para despejar la mente y operar desde máxima claridad y enfoque.',
      objectives: ['Práctica diaria de journaling', 'Eliminación de distracciones', 'Meditación de 10 minutos'],
      rewards: ['280 puntos de experiencia', 'Insignia: Mente Clara', 'Técnicas de enfoque avanzadas'],
      benefits: ['Mente despejada', 'Mayor productividad', 'Decisiones más sabias', 'Menos ansiedad'] },
    { id: 13, title: 'Victoria: Ocio',      subtitle: 'Descanso consciente',     category: 'victorias', territory: 'ocio',       image: null, color: '#f97316', propocoins: 250,
      description: 'Aprende a descansar de verdad en 3 días. Un protocolo de restauración profunda que recarga la batería al 100%.',
      objectives: ['Implementar rutina nocturna', 'Día sin pantallas', 'Práctica de juego consciente'],
      rewards: ['250 puntos de experiencia', 'Insignia: Maestro del Descanso', 'Protocolo de sueño premium'],
      benefits: ['Descanso profundo', 'Mente renovada', 'Cuerpo restaurado', 'Creatividad desbloqueada'] },
  ],
  mapas: [
    { id: 14, title: 'Mapa del Cuerpo',     subtitle: 'Los 8 territorios físicos', category: 'mapas', territory: 'cuerpo',     image: null, color: '#ef4444', propocoins: 750,
      description: 'El mapa completo del territorio físico. Comprende los 8 sistemas del cuerpo y cómo optimizar cada uno para una salud y vitalidad supremas.',
      objectives: ['Comprender los sistemas corporales', 'Crear protocolo personalizado', 'Mapear zonas de optimización'],
      rewards: ['750 puntos de experiencia', 'Insignia: Cartógrafo Corporal', 'Análisis corporal completo'],
      benefits: ['Comprensión profunda del cuerpo', 'Protocolo de salud personalizado', 'Prevención de lesiones', 'Optimización física'] },
    { id: 15, title: 'Mapa Mental',         subtitle: 'Arquitectura de la mente', category: 'mapas', territory: 'mente',      image: null, color: '#60a5fa', propocoins: 780,
      description: 'Explora la arquitectura de tu mente. Un mapa detallado de los sistemas cognitivos y cómo utilizarlos para maximizar tu potencial intelectual.',
      objectives: ['Mapear patrones de pensamiento', 'Identificar fortalezas cognitivas', 'Diseñar sistema de aprendizaje'],
      rewards: ['780 puntos de experiencia', 'Insignia: Arquitecto Mental', 'Test cognitivo avanzado'],
      benefits: ['Uso óptimo de la mente', 'Aprendizaje acelerado', 'Memoria mejorada', 'Creatividad potenciada'] },
    { id: 16, title: 'Mapa del Templo',     subtitle: 'Visión total del sistema', category: 'mapas', territory: 'vocacion',   image: null, color: '#8b5cf6', propocoins: 1200,
      description: 'El gran mapa maestro. Una visión completa del sistema del Templo y cómo todos los territorios se interconectan para crear una vida extraordinaria.',
      objectives: ['Comprender el sistema completo', 'Identificar conexiones entre territorios', 'Crear estrategia de vida integral'],
      rewards: ['1200 puntos de experiencia', 'Insignia: Guardián del Templo', 'Acceso VIP a todos los mapas'],
      benefits: ['Visión sistémica de la vida', 'Integración total', 'Estrategia de vida clara', 'Maestría del sistema'] },
    { id: 17, title: 'Mapa Financiero',     subtitle: 'Flujos de abundancia',    category: 'mapas', territory: 'finanzas',   image: null, color: '#eab308', propocoins: 820,
      description: 'Navega los flujos de energía financiera. Un mapa completo para entender, crear y expandir la abundancia en todas sus formas.',
      objectives: ['Mapear flujos de dinero actuales', 'Identificar fugas financieras', 'Diseñar arquitectura de abundancia'],
      rewards: ['820 puntos de experiencia', 'Insignia: Arquitecto de Abundancia', 'Simulador financiero'],
      benefits: ['Claridad financiera total', 'Sistemas de generación de riqueza', 'Eliminación de deudas', 'Patrimonio creciente'] },
    { id: 18, title: 'Mapa Relacional',     subtitle: 'Red de vínculos y tribu', category: 'mapas', territory: 'relaciones', image: null, color: '#22c55e', propocoins: 720,
      description: 'El mapa de tu ecosistema relacional. Comprende y optimiza todas las relaciones de tu vida para construir una tribu poderosa y amorosa.',
      objectives: ['Mapear red relacional actual', 'Identificar relaciones vitales', 'Construir tribu intencional'],
      rewards: ['720 puntos de experiencia', 'Insignia: Tejedor de Mundos', 'Acceso a comunidad élite'],
      benefits: ['Red relacional poderosa', 'Vínculos profundos', 'Apoyo mutuo', 'Expansión colectiva'] },
  ],
};

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

// ─────────────────────────────────────────────
//  STAFF CANVAS — with activeSphere support
// ─────────────────────────────────────────────
function StaffCanvas({ activeTab, activeSphereTerritory }) {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    t: 0,
    angles: SPHERES.map((_, i) => (i / 8) * Math.PI * 2),
    speed: 0.004,
    raf: null,
    burstScale: SPHERES.map(() => 1),
    burstAlpha: SPHERES.map(() => 1),
  });

  const coreText = TAB_CORE_TEXT[activeTab] || 'TODO';
  const tabStyle = TAB_STYLES[activeTab] || TAB_STYLES.todo;
  const activeSphereRef = useRef(activeSphereTerritory);
  useEffect(() => { activeSphereRef.current = activeSphereTerritory; }, [activeSphereTerritory]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const st = stateRef.current;
    st.t++;

    const activeT = activeSphereRef.current;
    const activeIdx = activeT ? SPHERES.findIndex(s => s.territory === activeT) : -1;

    st.angles = st.angles.map((a, i) => {
      const speedMult = (activeIdx >= 0 && i !== activeIdx) ? 0.3 : 1;
      return a + st.speed * (1 + i * 0.03) * speedMult;
    });

    ctx.clearRect(0, 0, W, H);

    const cx = W / 2;
    const cy = H * 0.42;
    const coreR = Math.min(W, H) * 0.13;
    const orbitR = coreR * 2.6;
    const sR = coreR * 0.44;

    // ── Staff body ──
    const staffTop = cy - coreR * 0.8;
    const staffBot = H + 20;
    const grd = ctx.createLinearGradient(cx - 8, staffTop, cx + 8, staffBot);
    grd.addColorStop(0, '#1a1010');
    grd.addColorStop(0.3, '#3d2a0a');
    grd.addColorStop(0.7, '#2a1a05');
    grd.addColorStop(1, '#0d0508');
    ctx.save();
    ctx.shadowColor = '#7c3aed';
    ctx.shadowBlur = 25;
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.roundRect(cx - 7, staffTop, 14, staffBot - staffTop, 3);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#b8860b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 7, staffTop); ctx.lineTo(cx - 7, staffBot);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 7, staffTop); ctx.lineTo(cx + 7, staffBot);
    ctx.stroke();
    for (let i = 0; i < 4; i++) {
      const ry = staffTop + (staffBot - staffTop) * (0.15 + i * 0.22);
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.ellipse(cx, ry, 10, 4, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    // ── Core ring ──
    ctx.save();
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(cx, cy, coreR + 18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#b8860b';
    ctx.beginPath();
    ctx.arc(cx, cy, coreR + 12, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const inner = coreR + 10, outer = coreR + 22;
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
      ctx.lineTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer);
      ctx.stroke();
    }
    ctx.restore();

    // ── Core sphere ──
    const pulse = Math.sin(st.t * 0.05) * 0.5 + 0.5;
    ctx.save();
    const tabRgb = hexToRgb(tabStyle.color);
    const gr = ctx.createRadialGradient(cx, cy, coreR * 0.1, cx, cy, coreR + 50);
    gr.addColorStop(0, `rgba(${tabRgb.r},${tabRgb.g},${tabRgb.b},${0.25 + pulse * 0.12})`);
    gr.addColorStop(0.5, `rgba(124,58,237,${0.15 + pulse * 0.08})`);
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.arc(cx, cy, coreR + 50, 0, Math.PI * 2);
    ctx.fill();
    const sg = ctx.createRadialGradient(cx - coreR * 0.3, cy - coreR * 0.3, coreR * 0.05, cx, cy, coreR);
    sg.addColorStop(0, 'rgba(180,120,255,0.95)');
    sg.addColorStop(0.5, 'rgba(100,50,210,0.9)');
    sg.addColorStop(1, 'rgba(50,10,130,0.95)');
    ctx.fillStyle = sg;
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 35 + pulse * 20;
    ctx.beginPath();
    ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
    ctx.fill();
    const hg = ctx.createRadialGradient(cx - coreR * 0.35, cy - coreR * 0.35, 0, cx - coreR * 0.2, cy - coreR * 0.2, coreR * 0.6);
    hg.addColorStop(0, 'rgba(255,255,255,0.45)');
    hg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hg;
    ctx.beginPath();
    ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const lines = coreText.split('\n');
    if (lines.length === 1) {
      const fontSize = Math.max(8, coreR * 0.32);
      ctx.font = `bold ${fontSize}px 'Cinzel', serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.fillText(lines[0], cx, cy);
    } else {
      const fontSize = Math.max(7, coreR * 0.25);
      ctx.font = `bold ${fontSize}px 'Cinzel', serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      const lh = fontSize * 1.3;
      lines.forEach((line, li) => {
        ctx.fillText(line, cx, cy + (li - (lines.length - 1) / 2) * lh);
      });
    }
    ctx.restore();

    // ── Connection lines ──
    SPHERES.forEach((s, i) => {
      const angle = st.angles[i];
      const sx = cx + Math.cos(angle) * orbitR;
      const sy = cy + Math.sin(angle) * orbitR;
      const c = hexToRgb(s.color);
      const isActive = activeIdx === i;
      const alpha = activeIdx >= 0 ? (isActive ? 0.45 : 0.05) : 0.18;
      ctx.save();
      ctx.strokeStyle = `rgba(${c.r},${c.g},${c.b},${alpha})`;
      ctx.lineWidth = isActive ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(sx, sy);
      ctx.stroke();
      ctx.restore();
    });

    // ── Orbiting spheres ──
    SPHERES.forEach((s, i) => {
      const angle = st.angles[i];
      const isActive = activeIdx === i;
      const isInactive = activeIdx >= 0 && !isActive;

      // Zoom effect: active sphere floats closer (larger)
      const zoomScale = isActive ? (1.5 + Math.sin(st.t * 0.06) * 0.12) : (isInactive ? 0.7 : 1);
      const dimAlpha = isInactive ? 0.25 : 1;

      const sx = cx + Math.cos(angle) * orbitR;
      const sy = cy + Math.sin(angle) * orbitR;
      const c = hexToRgb(s.color);
      const rr = sR * zoomScale;

      ctx.save();
      ctx.globalAlpha = dimAlpha;

      // Active sphere: extra dramatic glow
      if (isActive) {
        const bigGlow = ctx.createRadialGradient(sx, sy, rr * 0.3, sx, sy, rr * 4);
        bigGlow.addColorStop(0, `rgba(${c.r},${c.g},${c.b},0.7)`);
        bigGlow.addColorStop(0.5, `rgba(${c.r},${c.g},${c.b},0.3)`);
        bigGlow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = bigGlow;
        ctx.beginPath();
        ctx.arc(sx, sy, rr * 4, 0, Math.PI * 2);
        ctx.fill();
      }

      const glow = ctx.createRadialGradient(sx, sy, rr * 0.2, sx, sy, rr * 2.5);
      glow.addColorStop(0, `rgba(${c.r},${c.g},${c.b},${isActive ? 0.7 : 0.5})`);
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(sx, sy, rr * 2.5, 0, Math.PI * 2);
      ctx.fill();

      const sbg = ctx.createRadialGradient(sx - rr * 0.3, sy - rr * 0.3, rr * 0.05, sx, sy, rr);
      sbg.addColorStop(0, `rgba(${Math.min(255, c.r + 80)},${Math.min(255, c.g + 80)},${Math.min(255, c.b + 80)},0.95)`);
      sbg.addColorStop(0.6, `rgba(${c.r},${c.g},${c.b},0.9)`);
      sbg.addColorStop(1, `rgba(${Math.max(0, c.r - 50)},${Math.max(0, c.g - 50)},${Math.max(0, c.b - 50)},0.95)`);
      ctx.fillStyle = sbg;
      ctx.shadowColor = s.color;
      ctx.shadowBlur = isActive ? 50 + Math.sin(st.t * 0.07) * 20 : 20;
      ctx.beginPath();
      ctx.arc(sx, sy, rr, 0, Math.PI * 2);
      ctx.fill();
      const shg = ctx.createRadialGradient(sx - rr * 0.35, sy - rr * 0.4, 0, sx - rr * 0.2, sy - rr * 0.2, rr * 0.6);
      shg.addColorStop(0, 'rgba(255,255,255,0.45)');
      shg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = shg;
      ctx.beginPath();
      ctx.arc(sx, sy, rr, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.font = `${rr * 0.9}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(s.icon, sx, sy);

      ctx.restore();
    });

    st.raf = requestAnimationFrame(draw);
  }, [coreText, tabStyle]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    stateRef.current.raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(stateRef.current.raf);
      window.removeEventListener('resize', resize);
    };
  }, [draw]);

  return (
    <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
  );
}

// ─────────────────────────────────────────────
//  TERRITORY LEGEND — now fully clickable
// ─────────────────────────────────────────────
function TerritoryLegend({ onSelectTerritory, activeTerritory }) {
  const [hoveredTerritory, setHoveredTerritory] = useState(null);

  return (
    <div style={{
      position: 'absolute',
      right: 0,
      top: '50%',
      transform: 'translateY(-50%)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'clamp(3px,0.8vw,6px)',
padding: 'clamp(10px,1.5vw,14px) clamp(6px,1vw,10px)',
      zIndex: 20,
      background: 'rgba(2,0,12,0.65)',
      borderRadius: '16px 0 0 16px',
      border: '1px solid rgba(212,175,55,0.15)',
      borderRight: 'none',
      backdropFilter: 'blur(12px)',
    }}>
      <style>{`
        @keyframes neonFlicker {
          0%,19%,21%,23%,25%,54%,56%,100% {
            opacity: 1;
            text-shadow: 0 0 6px #b44fff, 0 0 12px #b44fff, 0 0 22px #7c3aed;
          }
          20%,24%,55% { opacity: 0.3; text-shadow: none; }
        }
        @keyframes bracketPulse {
          0%,100% { opacity: 0.5; }
          50%      { opacity: 1; }
        }
        @keyframes sweepDown {
          0%   { top: -30%; opacity: 0; }
          8%   { opacity: 1; }
          92%  { opacity: 1; }
          100% { top: 110%; opacity: 0; }
        }
      `}</style>

      {/* SWEEP — baja con el flicker */}
      <div style={{
        position: 'absolute',
        left: 0, right: 0,
        top: '-30%',
        height: '28%',
        background: 'linear-gradient(180deg, transparent 0%, rgba(180,79,255,0.18) 40%, rgba(212,175,55,0.10) 60%, transparent 100%)',
        pointerEvents: 'none',
        zIndex: 30,
        animation: 'sweepDown 4s ease-in-out infinite',
        borderRadius: '12px',
        filter: 'blur(2px)',
      }} />

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '5px',
        marginBottom: '10px',
      }}>
        <span style={{
          fontFamily: "'Cinzel', serif",
          fontSize: '9px',
          color: '#b44fff',
          animation: 'bracketPulse 1.8s ease-in-out infinite',
          lineHeight: 1,
        }}>⌊</span>

        <span style={{
          fontFamily: "'Cinzel', serif",
          fontSize: '7px',
          letterSpacing: '1.5px',
          color: '#c084fc',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          animation: 'neonFlicker 4s ease-in-out infinite',
        }}>Navega los territorios</span>

        <span style={{
          fontFamily: "'Cinzel', serif",
          fontSize: '9px',
          color: '#b44fff',
          animation: 'bracketPulse 1.8s ease-in-out 0.9s infinite',
          lineHeight: 1,
        }}>⌉</span>
      </div>

      {SPHERES.map(s => {
        const c = hexToRgb(s.color);
        const isHovered = hoveredTerritory === s.territory;
        const isActive = activeTerritory === s.territory;
        return (
          <div
            key={s.territory}
            onClick={() => onSelectTerritory(s.territory)}
            onMouseEnter={() => setHoveredTerritory(s.territory)}
            onMouseLeave={() => setHoveredTerritory(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 12px',
              borderRadius: '12px',
              background: isActive
                ? `rgba(${c.r},${c.g},${c.b},0.3)`
                : isHovered
                  ? `rgba(${c.r},${c.g},${c.b},0.15)`
                  : 'rgba(255,255,255,0.03)',
              border: `1px solid rgba(${c.r},${c.g},${c.b},${isActive ? 0.85 : isHovered ? 0.5 : 0.12})`,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: isActive
                ? `0 0 18px rgba(${c.r},${c.g},${c.b},0.5), inset 0 1px 0 rgba(255,255,255,0.1)`
                : isHovered
                  ? `0 0 12px rgba(${c.r},${c.g},${c.b},0.3)`
                  : 'none',
              transform: isActive ? 'translateX(-3px)' : isHovered ? 'translateX(-1px)' : 'none',
              minWidth: 'clamp(100px,18vw,140px)',
            }}
          >
            <span style={{
              fontSize: '18px',
              lineHeight: 1,
              flexShrink: 0,
              filter: (isActive || isHovered) ? `drop-shadow(0 0 6px ${s.color})` : 'none',
              transition: 'filter 0.2s ease',
            }}>{s.icon}</span>

            <span style={{
              fontFamily: "'Cinzel', serif",
              fontSize: '10px',
              letterSpacing: '1px',
              color: isActive ? s.color : isHovered ? s.color : 'rgba(220,210,255,0.75)',
              fontWeight: isActive ? '800' : '600',
              transition: 'color 0.2s ease',
              whiteSpace: 'nowrap',
            }}>{s.label}</span>

            {isActive && (
              <div style={{
                width: '6px', height: '6px',
                borderRadius: '50%',
                background: s.color,
                boxShadow: `0 0 8px ${s.color}, 0 0 16px ${s.color}`,
                flexShrink: 0,
                marginLeft: 'auto',
                animation: 'legendPulse 1.5s ease-in-out infinite',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
//  ANIMATED ENERGY BORDER
// ─────────────────────────────────────────────
function EnergyBorder({ color = '#7c3aed', speed = 3 }) {
  const { r, g, b } = hexToRgb(color);
  const duration = Math.max(speed * 2.5, 7);
  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', borderRadius: 'inherit', overflow: 'visible', zIndex: 2 }}>
      <rect x="1" y="1" width="calc(100% - 2px)" height="calc(100% - 2px)" rx="15" ry="15"
        fill="none" stroke={`rgba(${r},${g},${b},0.9)`} strokeWidth="2"
        strokeDasharray="60 1340" strokeLinecap="round"
        filter={`drop-shadow(0 0 5px rgba(${r},${g},${b},0.9))`}
        style={{ animation: `borderTravel ${duration}s linear infinite` }} />
      <style>{`@keyframes borderTravel { 0%{ stroke-dashoffset:0; } 100%{ stroke-dashoffset:-1400; } }`}</style>
    </svg>
  );
}

// ─────────────────────────────────────────────
//  TERRITORY DETAIL OVERLAY — cinematic
// ─────────────────────────────────────────────
function TerritoryDetail({ territoryKey, onClose, onNavigate }) {
  const [visible, setVisible] = useState(false);
  const [section, setSection] = useState('essence');
  const scrollRef = useRef(null);
  const data = TERRITORY_DEEP[territoryKey];
  const sphere = TERRITORY_MAP[territoryKey];
  const c = data ? hexToRgb(data.color) : { r: 124, g: 58, b: 237 };
  const allKeys = Object.keys(TERRITORY_DEEP);
  const currentIdx = allKeys.indexOf(territoryKey);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 20);
    setSection('essence');
    return () => clearTimeout(t);
  }, [territoryKey]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 400);
  };

  const handleNav = (dir) => {
    setVisible(false);
    setTimeout(() => {
      const nextIdx = (currentIdx + dir + allKeys.length) % allKeys.length;
      onNavigate(allKeys[nextIdx]);
    }, 300);
  };

  if (!data) return null;

  const SECTIONS = [
    { id: 'essence', label: 'Esencia', icon: '◈' },
    { id: 'role',    label: 'Rol',     icon: '⬡' },
    { id: 'exercises', label: 'Ejercicios', icon: '⚔' },
    { id: 'connections', label: 'Conexiones', icon: '∞' },
    { id: 'mastery',  label: 'Maestría', icon: '✦' },
    { id: 'collapse', label: 'Colapso',  icon: '⚠' },
  ];

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: window.innerWidth < 1024 ? '0' : 'clamp(8px,2vw,20px)',
        background: `rgba(1,0,10,${visible ? 0.95 : 0})`,
        backdropFilter: `blur(${visible ? 24 : 0}px)`,
        transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      <style>{`
        @keyframes tdSlideIn {
          from { opacity:0; transform:scale(0.85) translateY(40px); }
          to   { opacity:1; transform:scale(1) translateY(0); }
        }
        @keyframes tdSymbolFloat {
          0%,100% { transform:translateY(0) scale(1) rotate(-3deg); }
          50%     { transform:translateY(-14px) scale(1.08) rotate(3deg); }
        }
        @keyframes tdPulseRing {
          0%,100% { transform:scale(1); opacity:0.5; }
          50%     { transform:scale(1.15); opacity:1; }
        }
        @keyframes tdShimmer {
          0%   { background-position: 0% center; }
          100% { background-position: 100% center; }
        }
        .td-scrollable::-webkit-scrollbar { width:3px; }
        .td-scrollable::-webkit-scrollbar-track { background:rgba(0,0,0,0.2); }
      `}</style>
      <style>{`
        @keyframes tdGlow {
          0%,100% { box-shadow: 0 0 20px rgba(${c.r},${c.g},${c.b},0.4); }
          50%     { box-shadow: 0 0 50px rgba(${c.r},${c.g},${c.b},0.8), 0 0 100px rgba(${c.r},${c.g},${c.b},0.3); }
        }
        .td-scrollable::-webkit-scrollbar-thumb { background:rgba(${c.r},${c.g},${c.b},0.4); border-radius:4px; }
      `}</style>

      <div
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: window.innerWidth < 1024 ? '100vw' : 'clamp(300px,92vw,820px)',
          width: '100%',
          maxHeight: '100dvh',
          height: window.innerWidth < 1024 ? '100dvh' : 'auto',
          borderRadius: window.innerWidth < 1024 ? '0px' : '28px',
          background: `linear-gradient(160deg, rgba(6,2,22,0.99) 0%, rgba(3,1,12,0.99) 100%)`,
          border: `1px solid rgba(${c.r},${c.g},${c.b},0.4)`,
          boxShadow: `0 0 100px rgba(${c.r},${c.g},${c.b},0.35), 0 0 200px rgba(${c.r},${c.g},${c.b},0.12), inset 0 1px 0 rgba(255,255,255,0.07)`,
          position: 'relative',
          animation: visible ? 'tdSlideIn 0.5s cubic-bezier(0.34,1.1,0.64,1) forwards' : 'none',
          opacity: visible ? 1 : 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >

        {/* ── CINEMATIC HEADER ── */}
        <div style={{
          position: 'relative',
          height: window.innerWidth < 1024 ? '90px' : 'clamp(120px,38vw,260px)',
          flexShrink: 0,
          background: `linear-gradient(135deg, rgba(${c.r},${c.g},${c.b},0.4) 0%, rgba(${c.r},${c.g},${c.b},0.12) 45%, rgba(0,0,0,0.9) 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'visible',
        }}>
          {/* Atmosphere layers */}
          <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse at 20% 25%, rgba(${c.r},${c.g},${c.b},0.5) 0%, transparent 55%)` }} />
          <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse at 80% 75%, rgba(${c.r},${c.g},${c.b},0.3) 0%, transparent 50%)` }} />
          <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 50% 50%, transparent 25%, rgba(0,0,0,0.7) 100%)' }} />

          {/* Blueprint grid */}
          <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.07 }}>
            {[...Array(10)].map((_,i) => <line key={`h${i}`} x1="0" y1={`${(i+1)*9}%`} x2="100%" y2={`${(i+1)*9}%`} stroke={data.color} strokeWidth="1" />)}
            {[...Array(12)].map((_,i) => <line key={`v${i}`} x1={`${(i+1)*8}%`} y1="0" x2={`${(i+1)*8}%`} y2="100%" stroke={data.color} strokeWidth="1" />)}
            <circle cx="50%" cy="50%" r="90" fill="none" stroke={data.color} strokeWidth="1.5" />
            <circle cx="50%" cy="50%" r="60" fill="none" stroke={data.color} strokeWidth="1" />
            <circle cx="50%" cy="50%" r="30" fill="none" stroke={data.color} strokeWidth="1" />
          </svg>

          {/* Pulse rings */}
          {[1.8, 2.4, 3.1].map((scale, i) => (
            <div key={i} style={{
              position:'absolute',
              width:'80px', height:'80px',
              borderRadius:'50%',
              border:`1px solid rgba(${c.r},${c.g},${c.b},${0.35 - i*0.1})`,
              animation:`tdPulseRing ${2.2+i*0.7}s ease-in-out infinite`,
              animationDelay:`${i*0.45}s`,
              transform:`scale(${scale})`,
            }} />
          ))}

          {/* Giant symbol */}
          <div style={{
            position: 'relative',
            zIndex: 2,
            animation: 'tdSymbolFloat 4s ease-in-out infinite',
            filter: `drop-shadow(0 0 40px ${data.color}) drop-shadow(0 0 80px ${data.color})`,
            fontSize: window.innerWidth < 1024 ? '32px' : '90px',
            lineHeight: 1,
          }}>{data.symbol}</div>

          {/* Bottom fade */}
          <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'120px', background:`linear-gradient(to top, rgba(6,2,22,1), transparent)` }} />

          {/* Territory number badge */}
          <div style={{
            position:'absolute', top:'18px', left:'18px',
            fontFamily:"'Cinzel', serif",
            fontSize:'9px',
            letterSpacing:'3px',
            color:`rgba(${c.r},${c.g},${c.b},0.8)`,
            textTransform:'uppercase',
          }}>
            Territorio {data.number}
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            style={{
              position:'absolute', top:'14px', right:'14px',
              width:'34px', height:'34px',
              background:'rgba(0,0,0,0.6)',
              border:`1px solid rgba(${c.r},${c.g},${c.b},0.35)`,
              borderRadius:'50%',
              color:'rgba(255,255,255,0.7)',
              fontSize:'15px',
              cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center',
              transition:'all 0.2s',
              zIndex:10,
            }}
          >✕</button>

          {/* Title block — bottom of header */}
          <div style={{
            position: 'absolute',
            bottom: window.innerWidth < 1024 ? '10px' : '20px',
            left: window.innerWidth < 1024 ? '16px' : '28px',
            right: window.innerWidth < 1024 ? '16px' : '28px',
          }}>
            <div style={{
              fontFamily:"'Raleway', sans-serif",
              fontSize: window.innerWidth < 1024 ? '8px' : '10px',
              letterSpacing:'3px',
              textTransform:'uppercase',
              color:`rgba(${c.r},${c.g},${c.b},0.75)`,
              marginBottom:'4px',
            }}>{data.subtitle}</div>
            <h2 style={{
              fontFamily:"'Cinzel', serif",
              fontSize: window.innerWidth < 1024 ? '20px' : 'clamp(22px,7vw,46px)',
              fontWeight:'900',
              letterSpacing:'0.06em',
              lineHeight:'1',
              color:'#ffffff',
              textShadow:`0 0 20px ${data.color}, 0 0 40px rgba(${c.r},${c.g},${c.b},0.6)`,
            }}>{data.title}</h2>
          </div>
        </div>

        {/* ── SECTION TABS ── */}
        <div style={{
          display: 'flex',
          gap: '4px',
          padding: '8px 12px',
          background:'rgba(0,0,0,0.4)',
          borderBottom:`1px solid rgba(${c.r},${c.g},${c.b},0.12)`,
          flexShrink: 0,
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}>
          {SECTIONS.map(sec => (
            <button
              key={sec.id}
              onClick={() => { setSection(sec.id); if (scrollRef.current) scrollRef.current.scrollTop = 0; }}
              style={{
                padding: '5px 12px',
                borderRadius: '16px',
                border: `1px solid rgba(${c.r},${c.g},${c.b},${section === sec.id ? 0.7 : 0.2})`,
                background: section === sec.id
                  ? `rgba(${c.r},${c.g},${c.b},0.2)`
                  : 'transparent',
                color: section === sec.id
                  ? data.color
                  : `rgba(${c.r},${c.g},${c.b},0.55)`,
                fontFamily:"'Cinzel', serif",
                fontSize:'8.5px',
                letterSpacing:'1.5px',
                cursor:'pointer',
                whiteSpace:'nowrap',
                transition:'all 0.2s ease',
                boxShadow: section === sec.id ? `0 0 12px rgba(${c.r},${c.g},${c.b},0.3)` : 'none',
              }}
            >
              <span style={{ marginRight:'4px' }}>{sec.icon}</span>{sec.label}
            </button>
          ))}
        </div>

        {/* ── CONTENT BODY ── */}
        <div ref={scrollRef} className="td-scrollable" style={{ overflowY:'auto', flex:1, padding:'clamp(10px,3vw,28px) clamp(10px,4vw,32px) clamp(12px,4vw,32px)' }}>

          {section === 'essence' && (
            <div>
              <SectionTitle color={data.color} icon="◈" text="¿Qué es este territorio?" />
              <BodyText>{data.essence}</BodyText>

              <SectionTitle color={data.color} icon="⬡" text="Cómo afecta tu vida" />
              <BodyText>{data.lifeImpact}</BodyText>

              <div style={{
                marginTop:'24px',
                padding:'18px 22px',
                borderRadius:'16px',
                background:`rgba(${c.r},${c.g},${c.b},0.06)`,
                border:`1px solid rgba(${c.r},${c.g},${c.b},0.25)`,
                borderLeft:`3px solid ${data.color}`,
              }}>
                <div style={{ fontFamily:"'Cinzel', serif", fontSize:'8px', letterSpacing:'2.5px', color:data.color, marginBottom:'10px', textTransform:'uppercase' }}>
                  ⚠ Advertencia del Templo
                </div>
                <p style={{ fontFamily:"'Raleway', sans-serif", fontSize:'13px', color:'rgba(220,210,255,0.9)', lineHeight:'1.75', fontStyle:'italic', fontWeight:'300' }}>
                  {data.warning}
                </p>
              </div>
            </div>
          )}

          {section === 'role' && (
            <div>
              <SectionTitle color={data.color} icon="⬡" text="El Rol de este Territorio en el Sistema" />
              <BodyText>{data.role}</BodyText>

              <SectionTitle color={data.color} icon="🎨" text="El Significado del Símbolo" />
              <BodyText>{data.symbolMeaning}</BodyText>

              <SectionTitle color={data.color} icon="🎨" text="El Significado del Color" />
              <BodyText>{data.colorMeaning}</BodyText>

              <div style={{
                marginTop:'24px',
                display:'flex',
                alignItems:'center',
                gap:'20px',
                padding:'20px 24px',
                borderRadius:'16px',
                background:`linear-gradient(135deg, rgba(${c.r},${c.g},${c.b},0.12), rgba(${c.r},${c.g},${c.b},0.04))`,
                border:`1px solid rgba(${c.r},${c.g},${c.b},0.3)`,
              }}>
                <div style={{ fontSize:'52px', filter:`drop-shadow(0 0 20px ${data.color})`, flexShrink:0 }}>{data.symbol}</div>
                <div>
                  <div style={{ fontFamily:"'Cinzel', serif", fontSize:'9px', letterSpacing:'2px', color:data.color, textTransform:'uppercase', marginBottom:'6px' }}>
                    Por qué identificar ejercicios de este territorio
                  </div>
                  <p style={{ fontFamily:"'Raleway', sans-serif", fontSize:'13px', color:'rgba(200,190,240,0.85)', lineHeight:'1.7', fontWeight:'300' }}>
                    Cuando ves el símbolo <strong style={{ color:data.color }}>{data.symbol}</strong> o el color <strong style={{ color:data.color }}>{data.title}</strong> en un ejercicio, significa que estás trabajando directamente en este territorio. Todo lo que lleva esta identidad visual activa la misma energía.
                  </p>
                </div>
              </div>
            </div>
          )}

          {section === 'exercises' && (
            <div>
              <SectionTitle color={data.color} icon="⚔" text="Ejercicios de este Territorio" />
              <BodyText>Los ejercicios que pertenecen a este territorio comparten su símbolo y color porque trabajan la misma dimensión energética. Cada uno activa una faceta diferente del mismo núcleo.</BodyText>

              <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginTop:'20px' }}>
                {data.exercises.map((ex, i) => (
                  <div key={i} style={{
                    display:'flex',
                    alignItems:'center',
                    gap:'14px',
                    padding:'14px 18px',
                    borderRadius:'12px',
                    background:`rgba(${c.r},${c.g},${c.b},0.06)`,
                    border:`1px solid rgba(${c.r},${c.g},${c.b},0.2)`,
                  }}>
                    <div style={{
                      width:'28px', height:'28px',
                      borderRadius:'50%',
                      background:`rgba(${c.r},${c.g},${c.b},0.2)`,
                      border:`1px solid rgba(${c.r},${c.g},${c.b},0.5)`,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontFamily:"'Cinzel', serif",
                      fontSize:'9px',
                      color:data.color,
                      flexShrink:0,
                    }}>
                      {String(i+1).padStart(2,'0')}
                    </div>
                    <span style={{ fontFamily:"'Raleway', sans-serif", fontSize:'13px', color:'rgba(210,200,250,0.9)', fontWeight:'300' }}>{ex}</span>
                  </div>
                ))}
              </div>

              <SectionTitle color={data.color} icon="🔓" text="¿Qué desbloquea este Territorio?" />
              <BodyText>{data.unlocks}</BodyText>
            </div>
          )}

          {section === 'connections' && (
            <div>
              <SectionTitle color={data.color} icon="∞" text="Cómo se Conecta con los Demás Territorios" />
              <BodyText>Ningún territorio opera en aislamiento. Cada uno es un nodo en un sistema vivo — cuando uno florece, los conectados reciben su energía. Cuando uno colapsa, los otros lo sienten.</BodyText>

              <div style={{ display:'flex', flexDirection:'column', gap:'12px', marginTop:'20px' }}>
                {data.connections.map((conn, i) => {
                  const cc = hexToRgb(conn.color);
                  return (
                    <div key={i} style={{
                      padding:'16px 20px',
                      borderRadius:'14px',
                      background:`rgba(${cc.r},${cc.g},${cc.b},0.05)`,
                      border:`1px solid rgba(${cc.r},${cc.g},${cc.b},0.25)`,
                      display:'flex',
                      alignItems:'flex-start',
                      gap:'14px',
                    }}>
                      <div style={{ fontSize:'28px', flexShrink:0, filter:`drop-shadow(0 0 8px ${conn.color})` }}>{conn.icon}</div>
                      <div>
                        <div style={{
                          fontFamily:"'Cinzel', serif",
                          fontSize:'10px',
                          letterSpacing:'2px',
                          color:conn.color,
                          textTransform:'uppercase',
                          marginBottom:'6px',
                          fontWeight:'700',
                        }}>{conn.label}</div>
                        <p style={{ fontFamily:"'Raleway', sans-serif", fontSize:'13px', color:'rgba(200,190,240,0.85)', lineHeight:'1.7', fontWeight:'300' }}>
                          {conn.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {section === 'mastery' && (
            <div>
              <SectionTitle color={data.color} icon="✦" text="Beneficios de Dominarlo" />
              <BodyText>Cuando este territorio está verdaderamente activo y cultivado, estos son los cambios que se instalan de forma permanente en tu vida:</BodyText>

              <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginTop:'20px' }}>
                {data.mastery.map((item, i) => (
                  <div key={i} style={{
                    display:'flex',
                    alignItems:'center',
                    gap:'12px',
                    padding:'12px 16px',
                    borderRadius:'10px',
                    background:`rgba(${c.r},${c.g},${c.b},0.06)`,
                    border:`1px solid rgba(${c.r},${c.g},${c.b},0.18)`,
                  }}>
                    <span style={{ color:data.color, fontSize:'10px', flexShrink:0 }}>◆</span>
                    <span style={{ fontFamily:"'Raleway', sans-serif", fontSize:'13px', color:'rgba(210,200,250,0.9)', fontWeight:'300' }}>{item}</span>
                  </div>
                ))}
              </div>

              <div style={{
                marginTop:'28px',
                padding:'20px 24px',
                borderRadius:'16px',
                background:`linear-gradient(135deg, rgba(${c.r},${c.g},${c.b},0.15), rgba(${c.r},${c.g},${c.b},0.05))`,
                border:`1px solid rgba(${c.r},${c.g},${c.b},0.4)`,
                textAlign:'center',
                animation:'tdGlow 3s ease-in-out infinite',
              }}>
                <div style={{ fontSize:'40px', marginBottom:'12px', filter:`drop-shadow(0 0 20px ${data.color})` }}>{data.symbol}</div>
                <div style={{ fontFamily:"'Cinzel', serif", fontSize:'10px', letterSpacing:'2px', color:data.color, textTransform:'uppercase', marginBottom:'8px' }}>
                  Desbloquea el potencial completo
                </div>
                <p style={{ fontFamily:"'Raleway', sans-serif", fontSize:'12px', color:`rgba(${c.r},${c.g},${c.b},0.8)`, lineHeight:'1.6', fontWeight:'300' }}>
                  {data.unlocks}
                </p>
              </div>
            </div>
          )}

          {section === 'collapse' && (
            <div>
              <SectionTitle color="#ef4444" icon="⚠" text="Consecuencias de Descuidarlo" />
              <BodyText>{data.collapse}</BodyText>

              <div style={{
                marginTop:'24px',
                padding:'20px 22px',
                borderRadius:'16px',
                background:'rgba(239,68,68,0.06)',
                border:'1px solid rgba(239,68,68,0.3)',
                borderLeft:'3px solid #ef4444',
              }}>
                <div style={{ fontFamily:"'Cinzel', serif", fontSize:'8px', letterSpacing:'2.5px', color:'rgba(239,68,68,0.9)', marginBottom:'10px', textTransform:'uppercase' }}>
                  ⚠ Señales de colapso
                </div>
                <p style={{ fontFamily:"'Raleway', sans-serif", fontSize:'13px', color:'rgba(220,200,200,0.85)', lineHeight:'1.8', fontStyle:'italic', fontWeight:'300' }}>
                  {data.warning}
                </p>
              </div>

              <SectionTitle color={data.color} icon="◈" text="Por qué actuar ahora" />
              <BodyText>Los territorios descuidados no permanecen estáticos — su influencia negativa crece silenciosamente. Cada día sin atención es un día en que los demás territorios absorben ese déficit. El Templo existe para que nunca tengas que llegar al colapso.</BodyText>
            </div>
          )}
        </div>

        {/* ── NAVIGATION ── */}
        <div style={{
          display:'flex',
          alignItems:'center',
          justifyContent:'space-between',
          padding:'10px 14px',
          borderTop:`1px solid rgba(${c.r},${c.g},${c.b},0.15)`,
          background:'rgba(0,0,0,0.4)',
          flexShrink:0,
        }}>
          <button
            onClick={() => handleNav(-1)}
            style={{
              display:'flex', alignItems:'center', gap:'8px',
              padding:'8px 18px',
              borderRadius:'20px',
              background:`rgba(${c.r},${c.g},${c.b},0.1)`,
              border:`1px solid rgba(${c.r},${c.g},${c.b},0.3)`,
              color:`rgba(${c.r},${c.g},${c.b},0.85)`,
              fontFamily:"'Cinzel', serif",
              fontSize:'9px',
              letterSpacing:'1.5px',
              cursor:'pointer',
              transition:'all 0.2s',
            }}
          >← Anterior</button>

          <div style={{
            display:'flex',
            gap:'5px',
          }}>
            {allKeys.map((k, i) => {
              const sp = TERRITORY_MAP[k];
              return (
                <div
                  key={k}
                  onClick={() => { setVisible(false); setTimeout(() => onNavigate(k), 300); }}
                  style={{
                    width: i === currentIdx ? '20px' : '6px',
                    height:'6px',
                    borderRadius:'3px',
                    background: i === currentIdx ? data.color : `rgba(${c.r},${c.g},${c.b},0.3)`,
                    cursor:'pointer',
                    transition:'all 0.3s ease',
                    boxShadow: i === currentIdx ? `0 0 8px ${data.color}` : 'none',
                  }}
                />
              );
            })}
          </div>

          <button
            onClick={() => handleNav(1)}
            style={{
              display:'flex', alignItems:'center', gap:'8px',
              padding:'8px 18px',
              borderRadius:'20px',
              background:`rgba(${c.r},${c.g},${c.b},0.1)`,
              border:`1px solid rgba(${c.r},${c.g},${c.b},0.3)`,
              color:`rgba(${c.r},${c.g},${c.b},0.85)`,
              fontFamily:"'Cinzel', serif",
              fontSize:'9px',
              letterSpacing:'1.5px',
              cursor:'pointer',
              transition:'all 0.2s',
            }}
          >Siguiente →</button>
        </div>

        <EnergyBorder color={data.color} />
      </div>
    </div>
  );
}

// Helpers for TerritoryDetail sections
function SectionTitle({ color, icon, text }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:'8px',
      marginBottom:'12px', marginTop:'22px',
    }}>
      <span style={{ color, fontSize:'12px' }}>{icon}</span>
      <div style={{
        fontFamily:"'Cinzel', serif",
        fontSize:'9px',
        letterSpacing:'2.5px',
        color,
        textTransform:'uppercase',
        fontWeight:'700',
      }}>{text}</div>
      <div style={{ flex:1, height:'1px', background:`rgba(${hexToRgb(color).r},${hexToRgb(color).g},${hexToRgb(color).b},0.2)` }} />
    </div>
  );
}

function BodyText({ children }) {
  return (
    <p style={{
      fontFamily:"'Raleway', sans-serif",
      fontSize:'clamp(12px,3.5vw,14px)',
      lineHeight:'1.75',
      color:'rgba(210,200,250,0.8)',
      fontWeight:'300',
      marginBottom:'8px',
    }}>{children}</p>
  );
}

function ModuleDetail({ module, onClose, ownedIds = new Set(), onRedeemSuccess }) {
  const [visible, setVisible] = useState(false);
  const [btnHovered, setBtnHovered] = useState(false);
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoMsg, setPromoMsg] = useState(null);
  const userId = useAuthStore(s => s.user?.id);
  const cristales = usePlayerStore(s => s.cristales);
  const addCristales = usePlayerStore(s => s.addCristales);
  const [buyLoading, setBuyLoading] = useState(false);
  const [buyMsg, setBuyMsg] = useState(null);
  const [showUnlockCinematic, setShowUnlockCinematic] = useState(false);

const playUnlockSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const play = (freq, start, dur, vol = 0.3) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.setValueAtTime(freq, ctx.currentTime + start);
      o.frequency.exponentialRampToValueAtTime(freq * 1.5, ctx.currentTime + start + dur * 0.6);
      g.gain.setValueAtTime(0, ctx.currentTime + start);
      g.gain.linearRampToValueAtTime(vol, ctx.currentTime + start + 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      o.start(ctx.currentTime + start);
      o.stop(ctx.currentTime + start + dur);
    };
    play(220, 0,    0.3, 0.2);
    play(330, 0.1,  0.3, 0.2);
    play(440, 0.2,  0.4, 0.25);
    play(660, 0.35, 0.5, 0.3);
    play(880, 0.5,  0.8, 0.2);
  } catch {}
};

  const handlePurchase = async () => {
    if (!userId) return;
    if (ownedIds.has(module.id)) return;
    if (cristales < module.propocoins) {
      setBuyMsg({ ok: false, text: '❌ No tienes suficientes PropoCoins' });
      setTimeout(() => setBuyMsg(null), 3000);
      return;
    }
    setBuyLoading(true);
    setBuyMsg(null);
    try {
      const { storeService } = await import('../../services/store.service');
      await storeService.purchase(userId, [{ product_id: module.id, qty: 1 }], module.propocoins);
      await addCristales(-module.propocoins);
      setBuyMsg({ ok: true, text: `✅ ¡${module.title} desbloqueado!` });
      missionsService.trackEvent(userId, 'purchase_made');
      // Si el módulo es de categoría mapas, trackear también maps_unlocked_count
      if (module.category === 'mapas') {
        missionsService.trackEvent(userId, 'maps_unlocked_count');
      }
      if (onRedeemSuccess) onRedeemSuccess(module);
      playUnlockSound();
      setShowUnlockCinematic(true);
    } catch (err) {
      setBuyMsg({ ok: false, text: '❌ ' + err.message });
    } finally {
      setBuyLoading(false);
    }
  };

  const handleRedeem = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoMsg(null);
    try {
      const { storeService } = await import('../../services/store.service');
      await storeService.redeemPromoCode(promoCode);
      playUnlockSound();
      setShowUnlockCinematic(true);
      setPromoCode('');
      if (onRedeemSuccess) onRedeemSuccess(module);
      // Trackeo misión mapas canjeados
      if (userId) {
        missionsService.trackEvent(userId, 'maps_unlocked_count');
      }
    } catch (err) {
      setPromoMsg({ ok: false, text: '❌ ' + err.message });
    } finally {
      setPromoLoading(false);
    }
  };
  const territory = TERRITORY_MAP[module.territory] || SPHERES[0];
  const c = hexToRgb(module.color);
  const cat = CATEGORY_CONFIG[module.category] || CATEGORY_CONFIG.todo;

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 20);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 380);
  };

  if (showUnlockCinematic) {
    return (
      <UnlockCinematic
        module={module}
        onDone={() => {
          setShowUnlockCinematic(false);
          onClose?.();
        }}
      />
    );
  }

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(8px,2vw,20px)',
        background: `rgba(1,0,10,${visible ? 0.92 : 0})`,
        backdropFilter: `blur(${visible ? 18 : 0}px)`,
        transition: 'all 0.38s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      <style>{`
        @keyframes detailFadeIn { from { opacity:0; transform:scale(0.88) translateY(30px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes shimmerH { 0%{ background-position: -200% center; } 100%{ background-position: 200% center; } }
        @keyframes floatIcon { 0%,100%{ transform:translateY(0) scale(1); } 50%{ transform:translateY(-8px) scale(1.05); } }
        @keyframes pulseRing { 0%,100%{ transform:scale(1); opacity:0.6; } 50%{ transform:scale(1.12); opacity:1; } }
        @keyframes spinSilver { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes coinPulse { 0%,100%{ opacity:1; text-shadow:0 0 8px #c8c8e0,0 0 18px rgba(200,200,230,0.5); } 50%{ opacity:0.78; text-shadow:0 0 16px #eeeeff,0 0 32px rgba(220,220,255,0.9),0 0 50px rgba(200,200,240,0.5); } }
      `}</style>

      <div
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: 'clamp(300px,90vw,700px)',
width: '100%',
maxHeight: '92dvh',
          overflowY: 'auto',
          borderRadius: '24px',
          background: `linear-gradient(160deg, rgba(8,3,28,0.99) 0%, rgba(4,1,16,0.99) 100%)`,
          border: `1px solid rgba(${c.r},${c.g},${c.b},0.35)`,
          boxShadow: `0 0 80px rgba(${c.r},${c.g},${c.b},0.3), 0 0 160px rgba(${c.r},${c.g},${c.b},0.12), inset 0 1px 0 rgba(255,255,255,0.06)`,
          position: 'relative',
          animation: visible ? 'detailFadeIn 0.4s cubic-bezier(0.34,1.1,0.64,1) forwards' : 'none',
          opacity: visible ? 1 : 0,
        }}
      >
        <div style={{
          position: 'relative',
          height: 'clamp(200px,35vw,380px)',
          background: module.image
            ? `radial-gradient(ellipse at 50% 40%, rgba(${c.r},${c.g},${c.b},0.2) 0%, rgba(0,0,0,0.95) 100%)`
            : `linear-gradient(135deg, rgba(${c.r},${c.g},${c.b},0.35) 0%, rgba(${c.r},${c.g},${c.b},0.1) 40%, rgba(0,0,0,0.8) 100%)`,
          borderRadius: '24px 24px 0 0',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {module.image ? (
            <img src={module.image} alt={module.title} style={{ width:'100%', height:'100%', objectFit:'contain', objectPosition:'center top' }} />
          ) : (
            <>
              <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse at 25% 30%, rgba(${c.r},${c.g},${c.b},0.45) 0%, transparent 60%)` }} />
              <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse at 75% 70%, rgba(${c.r},${c.g},${c.b},0.25) 0%, transparent 55%)` }} />
              <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,0.7) 100%)' }} />
              <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.06 }}>
                {[...Array(8)].map((_,i) => <line key={`h${i}`} x1="0" y1={`${(i+1)*11}%`} x2="100%" y2={`${(i+1)*11}%`} stroke={module.color} strokeWidth="1" />)}
                {[...Array(10)].map((_,i) => <line key={`v${i}`} x1={`${(i+1)*9}%`} y1="0" x2={`${(i+1)*9}%`} y2="100%" stroke={module.color} strokeWidth="1" />)}
                <circle cx="50%" cy="50%" r="70" fill="none" stroke={module.color} strokeWidth="2" />
                <circle cx="50%" cy="50%" r="45" fill="none" stroke={module.color} strokeWidth="1" />
              </svg>
              {[1.6, 2.0, 2.5].map((scale, i) => (
                <div key={i} style={{ position:'absolute', width:'80px', height:'80px', borderRadius:'50%', border:`1px solid rgba(${c.r},${c.g},${c.b},${0.3 - i*0.08})`, animation:`pulseRing ${2+i*0.6}s ease-in-out infinite`, animationDelay:`${i*0.4}s`, transform:`scale(${scale})` }} />
              ))}
              <div style={{ position:'relative', zIndex:2, animation:'floatIcon 3.5s ease-in-out infinite' }}>
                <div style={{ fontSize:'80px', filter:`drop-shadow(0 0 30px ${module.color}) drop-shadow(0 0 60px ${module.color})`, lineHeight:1 }}>{territory.icon}</div>
              </div>
            </>
          )}
          <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'120px', background:'linear-gradient(to top, rgba(8,3,28,1), transparent)' }} />
          <div style={{ position:'absolute', top:'16px', left:'16px', display:'flex', alignItems:'center', gap:'7px', padding:'6px 14px 6px 10px', background:`rgba(${c.r},${c.g},${c.b},0.2)`, border:`1px solid rgba(${c.r},${c.g},${c.b},0.55)`, borderRadius:'24px', backdropFilter:'blur(12px)' }}>
            <span style={{ fontSize:'15px' }}>{territory.icon}</span>
            <span style={{ fontFamily:"'Cinzel', serif", fontSize:'9px', letterSpacing:'2px', color:module.color, textTransform:'uppercase', fontWeight:'700' }}>{territory.label}</span>
          </div>
          <div style={{ position:'absolute', top:'16px', right:'16px', display:'flex', alignItems:'center', gap:'5px', padding:'5px 12px 5px 9px', background:cat.bg, border:`1px solid ${cat.border}`, borderRadius:'20px', backdropFilter:'blur(10px)' }}>
            <span style={{ fontSize:'12px' }}>{cat.icon}</span>
            <span style={{ fontFamily:"'Cinzel', serif", fontSize:'8px', letterSpacing:'1.8px', color:cat.text, textTransform:'uppercase', fontWeight:'700' }}>{cat.label}</span>
          </div>
        </div>

        <div style={{ padding:'clamp(16px,4vw,32px) clamp(16px,4vw,32px) clamp(20px,4vw,36px)' }}>
          <div style={{ marginBottom:'24px' }}>
            <div style={{ fontFamily:"'Raleway', sans-serif", fontSize:'12px', letterSpacing:'3px', textTransform:'uppercase', color:`rgba(${c.r},${c.g},${c.b},0.8)`, marginBottom:'8px' }}>{module.subtitle}</div>
            <h2 style={{ fontFamily:"'Cinzel', serif", fontSize:'clamp(20px,4vw,30px)', fontWeight:'900', color:'#f0e8ff', letterSpacing:'0.04em', lineHeight:'1.2', marginBottom:'0', background:`linear-gradient(135deg, #f0e8ff, ${module.color}, #f0e8ff)`, backgroundSize:'200% auto', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', animation:'shimmerH 4s linear infinite' }}>{module.title}</h2>
          </div>
          <div style={{ height:'1px', background:`linear-gradient(90deg, transparent, rgba(${c.r},${c.g},${c.b},0.6), transparent)`, marginBottom:'24px' }} />
          <p style={{ fontFamily:"'Raleway', sans-serif", fontSize:'14px', lineHeight:'1.8', color:'rgba(220,210,255,0.8)', marginBottom:'28px', fontWeight:'300' }}>{module.description}</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(clamp(140px,30vw,280px), 1fr))', gap:'clamp(10px,2vw,20px)', marginBottom:'28px' }}>
            <div style={{ padding:'15px', borderRadius:'14px', background:`linear-gradient(135deg, rgba(${c.r},${c.g},${c.b},0.12), rgba(${c.r},${c.g},${c.b},0.04))`, border:`1px solid rgba(${c.r},${c.g},${c.b},0.35)`, boxShadow:`inset 0 1px 0 rgba(${c.r},${c.g},${c.b},0.15)` }}>
              <div style={{ fontFamily:"'Cinzel', serif", fontSize:'10px', letterSpacing:'3px', textTransform:'uppercase', color:module.color, marginBottom:'14px', display:'flex', alignItems:'center', gap:'8px', textShadow:`0 0 12px rgba(${c.r},${c.g},${c.b},0.8)` }}>
                <span style={{ fontSize:'14px' }}>⚔</span> Objetivos
              </div>
              {(module.objectives || []).length === 0
                ? <div style={{ color:'rgba(255,255,255,0.2)', fontSize:'11px', fontFamily:"'Raleway', sans-serif" }}>Sin objetivos definidos</div>
                : (module.objectives || []).map((obj, i) => (
                <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:'10px', marginBottom:'10px', fontFamily:"'Raleway', sans-serif", fontSize:'13px', color:'rgba(235,225,255,0.95)', lineHeight:'1.6' }}>
                  <span style={{ color:module.color, fontSize:'10px', marginTop:'5px', flexShrink:0, filter:`drop-shadow(0 0 4px rgba(${c.r},${c.g},${c.b},0.9))` }}>◆</span>{obj}
                </div>
              ))}
            </div>
            <div style={{ padding:'10px', borderRadius:'14px', background:`linear-gradient(135deg, rgba(${c.r},${c.g},${c.b},0.12), rgba(${c.r},${c.g},${c.b},0.04))`, border:`1px solid rgba(${c.r},${c.g},${c.b},0.35)`, boxShadow:`inset 0 1px 0 rgba(${c.r},${c.g},${c.b},0.15)` }}>
              <div style={{ fontFamily:"'Cinzel', serif", fontSize:'10px', letterSpacing:'3px', textTransform:'uppercase', color:module.color, marginBottom:'14px', display:'flex', alignItems:'center', gap:'8px', textShadow:`0 0 12px rgba(${c.r},${c.g},${c.b},0.8)` }}>
                <span style={{ fontSize:'14px' }}>✨</span> Beneficios
              </div>
              {(module.benefits || []).length === 0
                ? <div style={{ color:'rgba(255,255,255,0.2)', fontSize:'11px', fontFamily:"'Raleway', sans-serif" }}>Sin beneficios definidos</div>
                : (module.benefits || []).map((b, i) => (
                <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:'10px', marginBottom:'10px', fontFamily:"'Raleway', sans-serif", fontSize:'13px', color:'rgba(235,225,255,0.95)', lineHeight:'1.6' }}>
                  <span style={{ color:module.color, fontSize:'10px', marginTop:'5px', flexShrink:0, filter:`drop-shadow(0 0 4px rgba(${c.r},${c.g},${c.b},0.9))` }}>◆</span>{b}
                </div>
              ))}
            </div>
          </div>
          

          {/* ── PropoCoins button with silver spin + zoom on hover ── */}
            <CountdownOrBuy
              module={module}
              ownedIds={ownedIds}
              btnHovered={btnHovered}
              setBtnHovered={setBtnHovered}
              buyLoading={buyLoading}
              handlePurchase={handlePurchase}
              c={c}
            />

{buyMsg && (
            <div style={{ marginTop:'10px', padding:'8px 12px', borderRadius:'8px',
              background: buyMsg.ok ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
              color: buyMsg.ok ? '#4ade80' : '#f87171',
              fontFamily:"'Raleway', sans-serif", fontSize:'12px', textAlign:'center' }}>
              {buyMsg.text}
            </div>
          )}

          {/* ── ACTIVAR HERRAMIENTA (solo si ya es owner) ── */}
          {ownedIds.has(module.id) && module.slug && (
            <ActivateToolButton module={module} />
          )}

          {/* ── PROMO CODE ── */}
          <div style={{ marginTop:'16px', borderRadius:'12px', border:'1px solid rgba(212,175,55,0.35)', overflow:'hidden', boxShadow:'0 0 20px rgba(212,175,55,0.08)' }}>
            <button onClick={() => setPromoOpen(o => !o)} style={{ width:'100%', padding:'14px 18px', background:`linear-gradient(135deg, rgba(${c.r},${c.g},${c.b},0.12), rgba(212,175,55,0.06))`, border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', color:'rgba(212,175,55,0.9)', fontFamily:"'Cinzel', serif", fontSize:'10px', letterSpacing:'2.5px', fontWeight:'700' }}>
              <span>🎟 ¿TIENES UN CÓDIGO PROMO?</span>
              <span>{promoOpen ? '▲' : '▼'}</span>
            </button>
            {promoOpen && (
              <div style={{ padding:'12px 16px 16px', background:'rgba(0,0,0,0.3)' }}>
                <div style={{ display:'flex', gap:'8px' }}>
                  <input
                    value={promoCode}
                    onChange={e => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="PROMO-XXXX-XXXX"
                    style={{ flex:1, padding:'10px 12px', background:'rgba(255,255,255,0.06)', border:`1px solid rgba(${c.r},${c.g},${c.b},0.3)`, borderRadius:'8px', color:'#fff', fontFamily:'monospace', fontSize:'13px', letterSpacing:'2px', outline:'none' }}
                  />
                  <button onClick={handleRedeem} disabled={promoLoading} style={{ padding:'10px 16px', background:`rgba(${c.r},${c.g},${c.b},0.25)`, border:`1px solid rgba(${c.r},${c.g},${c.b},0.5)`, borderRadius:'8px', color:module.color, fontFamily:"'Cinzel', serif", fontSize:'9px', letterSpacing:'1.5px', cursor:'pointer', whiteSpace:'nowrap' }}>
                    {promoLoading ? '...' : 'CANJEAR'}
                  </button>
                </div>
                {promoMsg && (
                  <div style={{ marginTop:'10px', padding:'8px 12px', borderRadius:'8px', background: promoMsg.ok ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: promoMsg.ok ? '#4ade80' : '#f87171', fontFamily:"'Raleway', sans-serif", fontSize:'12px' }}>
                    {promoMsg.text}
                  </div>
                )}
              </div>
            )}
          </div>
          <div style={{ textAlign:'center', marginTop:'16px', fontFamily:"'Raleway', sans-serif", fontSize:'10px', color:'rgba(255,255,255,0.2)', letterSpacing:'1.5px' }}>Clic fuera para cerrar</div>
        </div>
        <EnergyBorder color={module.color} />
      </div>
    </div>
  );
}

function CountdownOrBuy({ module, ownedIds, btnHovered, setBtnHovered, buyLoading, handlePurchase, c }) {
  const { user } = useAuthStore();
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    let lockDate = null;
    if (module.release_date) {
      const rd = new Date(module.release_date);
      if (rd > Date.now()) lockDate = rd;
    }
    if ((module.unlock_after_days > 0 || module.unlock_after_hours > 0) && user?.created_at) {
      const personal = new Date(
        new Date(user.created_at).getTime()
        + (module.unlock_after_days  || 0) * 86400000
        + (module.unlock_after_hours || 0) * 3600000
      );
      if (personal > Date.now() && (!lockDate || personal > lockDate)) lockDate = personal;
    }
    if (!lockDate) { setTimeLeft(null); return; }
    const tick = () => {
      const diff = lockDate - Date.now();
      if (diff <= 0) { setTimeLeft(null); return; }
      setTimeLeft({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [module, user]);

  if (timeLeft) return (
    <div style={{ borderRadius:'14px', padding:'18px 16px', background:'linear-gradient(135deg,rgba(139,92,246,0.12),rgba(30,10,60,0.9))', border:'1px solid rgba(139,92,246,0.35)', textAlign:'center' }}>
      <div style={{ fontFamily:"'Cinzel',serif", fontSize:'9px', letterSpacing:'3px', color:'rgba(139,92,246,0.7)', marginBottom:'12px' }}>⏳ DISPONIBLE EN</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'8px' }}>
        {[['d','DÍAS'],['h','HORAS'],['m','MIN'],['s','SEG']].map(([k,label]) => (
          <div key={k} style={{ background:'rgba(139,92,246,0.1)', border:'1px solid rgba(139,92,246,0.25)', borderRadius:'10px', padding:'10px 4px' }}>
            <div style={{ fontFamily:"'Cinzel',serif", fontSize:'22px', fontWeight:'900', color:'#c4b5fd', lineHeight:1 }}>
              {String(timeLeft[k]).padStart(2,'0')}
            </div>
            <div style={{ fontFamily:"'Cinzel',serif", fontSize:'7px', letterSpacing:'1.5px', color:'rgba(196,181,253,0.5)', marginTop:'4px' }}>{label}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop:'10px', fontFamily:"'Cinzel',serif", fontSize:'8px', letterSpacing:'1px', color:'rgba(139,92,246,0.4)' }}>
        COMPLETA TU CAMINO PARA DESBLOQUEARLO
      </div>
    </div>
  );

  return (
    <div
      onMouseEnter={() => setBtnHovered(true)}
      onMouseLeave={() => setBtnHovered(false)}
      style={{
        position:'relative', borderRadius:'14px', padding:'2px', overflow:'hidden',
        transition:'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease',
        transform: btnHovered ? 'scale(1.045)' : 'scale(1)',
        boxShadow: btnHovered
          ? '0 0 40px rgba(200,200,255,0.35), 0 0 80px rgba(180,180,240,0.18), 0 8px 30px rgba(0,0,0,0.5)'
          : '0 0 30px rgba(200,200,255,0.12), 0 4px 20px rgba(0,0,0,0.4)',
        cursor:'pointer',
      }}
    >
      <div style={{
        position:'absolute', top:'-100%', left:'-100%', width:'300%', height:'300%',
        background:'conic-gradient(from 0deg, transparent 0deg, rgba(160,160,210,0.3) 30deg, rgba(220,220,255,0.8) 65deg, #ffffff 90deg, rgba(220,220,255,0.8) 115deg, rgba(160,160,210,0.3) 150deg, transparent 200deg)',
        animation:`spinSilver ${btnHovered ? '1.2s' : '2.5s'} linear infinite`,
      }} />
      <button
        onClick={!ownedIds.has(module.id) ? handlePurchase : undefined}
        disabled={buyLoading}
        style={{
          position:'relative', width:'100%', padding:'18px 0',
          opacity: buyLoading ? 0.7 : 1,
          background: btnHovered
            ? 'linear-gradient(135deg, rgba(14,6,38,0.98), rgba(8,3,22,0.98))'
            : `linear-gradient(135deg, rgba(${c.r},${c.g},${c.b},0.28), rgba(${c.r},${c.g},${c.b},0.14))`,
          border:'none', borderRadius:'12px',
          color: btnHovered ? '#e8e8ff' : module.color,
          fontFamily:"'Cinzel', serif", fontSize:'12px', letterSpacing:'2.5px',
          textTransform:'uppercase', cursor:'pointer',
          transition:'color 0.3s ease, background 0.3s ease',
          fontWeight:'700', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px',
        }}
      >
        <span style={{ fontSize:'18px', lineHeight:1 }}>{ownedIds.has(module.id) ? '✅' : '🪙'}</span>
        {ownedIds.has(module.id) ? 'YA LO TIENES' : 'Canjeable por'}&nbsp;
        <strong style={{ fontWeight:'900', fontSize:'16px', color:'#d8d8f0', animation:'coinPulse 2.5s ease-in-out infinite', letterSpacing:'0' }}>{module.propocoins ?? '—'}</strong>
        &nbsp;PropoCoins
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
//  MODULE CARD
// ─────────────────────────────────────────────
function ModuleCard({ module, onOpen, owned = false, isSeen = false }) {
  const [hovered, setHovered] = useState(false);
  const { user } = useAuthStore();
  const cat = CATEGORY_CONFIG[module.category] || CATEGORY_CONFIG.todo;

  const lockInfo = (() => {
    let lockDate = null;
    if (module.release_date) {
      const rd = new Date(module.release_date);
      if (rd > Date.now()) lockDate = rd;
    }
    if ((module.unlock_after_days > 0 || module.unlock_after_hours > 0) && user?.created_at) {
      const personal = new Date(
        new Date(user.created_at).getTime()
        + (module.unlock_after_days || 0) * 86400000
        + (module.unlock_after_hours || 0) * 3600000
      );
      if (personal > Date.now() && (!lockDate || personal > lockDate)) lockDate = personal;
    }
    if (!lockDate) return null;
    const diff = lockDate - Date.now();
    return {
      days:  Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      mins:  Math.floor((diff % 3600000) / 60000),
    };
  })();
  const territory = TERRITORY_MAP[module.territory] || SPHERES[0];
  const c = hexToRgb(module.color);

  return (
    <div
      onClick={() => onOpen(module)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position:'relative', borderRadius:'16px', overflow:'hidden', cursor:'pointer',
        transition:'transform 0.28s ease, box-shadow 0.28s ease',
        transform: hovered ? 'translateY(-5px) scale(1.02)' : 'translateY(0) scale(1)',
        boxShadow: hovered
          ? `0 20px 60px rgba(${c.r},${c.g},${c.b},0.45), 0 0 80px rgba(${c.r},${c.g},${c.b},0.2)`
          : '0 4px 20px rgba(0,0,0,0.5)',
        background: 'linear-gradient(145deg, rgba(15,5,35,0.95), rgba(5,0,20,0.98))',
        zIndex: hovered ? 10 : 1,
      }}
    >
      <style>{`
        @keyframes catPulse { 0%,100%{box-shadow:0 0 6px 1px rgba(${cat.glow},0.55),0 0 14px 2px rgba(${cat.glow},0.3);} 50%{box-shadow:0 0 14px 3px rgba(${cat.glow},0.9),0 0 28px 6px rgba(${cat.glow},0.5);} }
        @keyframes catShimmer { 0%{opacity:0.7;} 50%{opacity:1;} 100%{opacity:0.7;} }
        @keyframes spinSilver { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes coinPulse { 0%,100%{ opacity:1; text-shadow:0 0 6px #c8c8e0,0 0 14px rgba(200,200,230,0.5); } 50%{ opacity:0.8; text-shadow:0 0 14px #e8e8ff,0 0 28px rgba(220,220,255,0.9),0 0 40px rgba(200,200,240,0.5); } }
        @keyframes sinCosto { 0%,100%{ box-shadow:0 0 14px rgba(37,99,168,0.7),0 0 30px rgba(37,99,168,0.3),inset 0 1px 0 rgba(255,255,255,0.15); filter:brightness(1); } 50%{ box-shadow:0 0 22px rgba(37,99,168,1),0 0 50px rgba(100,160,255,0.5),inset 0 1px 0 rgba(255,255,255,0.25); filter:brightness(1.2); } }
        @keyframes badgeFreeCard { 0%,100%{ transform:scale(1); box-shadow:0 0 14px rgba(0,200,83,0.8),0 0 28px rgba(0,200,83,0.4); } 50%{ transform:scale(1.08); box-shadow:0 0 22px rgba(0,200,83,1),0 0 44px rgba(0,200,83,0.6); } }
      `}</style>
      <EnergyBorder color={module.color} />
      <div style={{ position:'relative', height:'clamp(160px,20vw,210px)', background: module.image ? 'transparent' : `linear-gradient(135deg, rgba(${c.r},${c.g},${c.b},0.25) 0%, rgba(${c.r},${c.g},${c.b},0.05) 50%, rgba(0,0,0,0.6) 100%)`, overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
        {module.image ? <img src={module.image} alt={module.title} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} /> : (
          <>
            <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse at 30% 30%, rgba(${c.r},${c.g},${c.b},0.35) 0%, transparent 65%)` }} />
            <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse at 70% 70%, rgba(${c.r},${c.g},${c.b},0.2) 0%, transparent 60%)` }} />
            <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.08 }}>
              {[...Array(6)].map((_,i) => <line key={`h${i}`} x1="0" y1={`${(i+1)*14}%`} x2="100%" y2={`${(i+1)*14}%`} stroke={module.color} strokeWidth="1" />)}
              {[...Array(8)].map((_,i) => <line key={`v${i}`} x1={`${(i+1)*11}%`} y1="0" x2={`${(i+1)*11}%`} y2="100%" stroke={module.color} strokeWidth="1" />)}
              <circle cx="50%" cy="50%" r="35" fill="none" stroke={module.color} strokeWidth="2" />
            </svg>
            <span style={{ fontSize:'52px', filter:`drop-shadow(0 0 16px ${module.color})`, zIndex:1, transition:'transform 0.3s ease', transform:hovered?'scale(1.15)':'scale(1)' }}>{territory.icon}</span>
          </>
        )}
        <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'80px', background:'linear-gradient(to top, rgba(5,0,20,0.98), transparent)' }} />

        {module.category === 'mapas' && !lockInfo && !owned && (
          <div style={{
            position: 'absolute', top: '12px', left: '12px', zIndex: 7,
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '5px 13px',
            background: 'linear-gradient(135deg, #00c853, #69f0ae)',
            border: '2px solid #69f0ae',
            borderRadius: '12px',
            boxShadow: '0 0 16px rgba(0,200,83,0.9), 0 0 32px rgba(0,200,83,0.4)',
            fontFamily: "'Cinzel', serif",
            fontSize: '10px', fontWeight: '900', letterSpacing: '2px',
            color: '#002200',
            animation: 'badgeFreeCard 1.6s ease-in-out infinite',
          }}>
            🎁 ¡GRATIS!
          </div>
        )}

        {lockInfo && !owned && (
          <>
            {/* Overlay oscuro de bloqueado */}
            <div style={{ position:'absolute', inset:0, background:'rgba(10,0,30,0.55)', zIndex:4, borderRadius:'16px 16px 0 0', backdropFilter:'blur(1px)' }} />
            {/* Ícono de candado */}
            <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-60%)', zIndex:5, fontSize:'32px', filter:'drop-shadow(0 0 12px rgba(139,92,246,0.9))' }}>🔒</div>
            {/* Badge contador */}
            <div style={{
              position:'absolute', bottom:'14px', left:'50%', transform:'translateX(-50%)',
              zIndex:6, background:'linear-gradient(135deg,rgba(109,40,217,0.97),rgba(76,29,149,0.97))',
              border:'1px solid rgba(196,181,253,0.6)', borderRadius:'20px',
              padding:'5px 14px', display:'flex', alignItems:'center', gap:'6px',
              boxShadow:'0 0 18px rgba(139,92,246,0.7), 0 0 40px rgba(139,92,246,0.3)',
              whiteSpace:'nowrap',
            }}>
              <span style={{ fontSize:'11px' }}>⏳</span>
              <span style={{ fontFamily:"'Cinzel',serif", fontSize:'10px', fontWeight:'700', color:'#e9d5ff', letterSpacing:'1px' }}>
                {lockInfo.days > 0
                  ? `${lockInfo.days}d ${lockInfo.hours}h`
                  : `${lockInfo.hours}h ${lockInfo.mins}m`}
              </span>
            </div>
          </>
        )}
        {owned && (
          <>
            {/* Borde verde exterior */}
            <div style={{ position:'absolute', inset:0, borderRadius:'16px', border:'2px solid rgba(34,197,94,0.7)', zIndex:6, pointerEvents:'none', boxShadow:'inset 0 0 30px rgba(34,197,94,0.1), 0 0 25px rgba(34,197,94,0.25)' }} />
            {/* Overlay oscuro sobre imagen */}
            <div style={{ position:'absolute', top:0, left:0, right:0, height:'200px', background:'rgba(2,12,6,0.55)', zIndex:5, pointerEvents:'none', borderRadius:'16px 16px 0 0' }} />
            {/* Sello central DESBLOQUEADO */}
            <div style={{ position:'absolute', top:0, left:0, right:0, height:'200px', zIndex:7, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-start', paddingTop:'22px', gap:'8px', pointerEvents:'none' }}>
              <div style={{ fontSize:'38px', filter:'drop-shadow(0 0 16px rgba(34,197,94,0.9))' }}>✅</div>
              <div style={{ fontFamily:"'Cinzel', serif", fontSize:'10px', letterSpacing:'3px', color:'#4ade80', fontWeight:'700', textShadow:'0 0 14px rgba(74,222,128,0.9)', textTransform:'uppercase' }}>DESBLOQUEADO</div>
            </div>
          </>
          
        )}
        
        <div style={{ position:'absolute', top:'12px', right:'12px', display:'flex', alignItems:'center', gap:'5px', padding:'4px 11px 4px 8px', background:cat.bg, border:`1px solid ${cat.border}`, borderRadius:'20px', color:cat.text, fontSize:'8.5px', fontFamily:"'Cinzel', serif", letterSpacing:'1.8px', fontWeight:'700', backdropFilter:'blur(6px)', textTransform:'uppercase', transition:'all 0.3s ease', boxShadow:`0 0 10px rgba(${cat.glow},0.4)`, ...(hovered?{background:`rgba(${cat.glow},0.3)`,border:`1px solid ${cat.shadow}`,boxShadow:`0 0 18px rgba(${cat.glow},0.6)`}:{}) }}>
          <span style={{ fontSize:'11px', lineHeight:1 }}>{cat.icon}</span>{cat.label}
        </div>
        <div style={{ position:'absolute', bottom:'8px', left:'10px', display:'flex', alignItems:'center', gap:'5px', padding:'3px 9px 3px 6px', background:`rgba(${c.r},${c.g},${c.b},0.18)`, border:`1px solid rgba(${c.r},${c.g},${c.b},0.35)`, borderRadius:'12px', backdropFilter:'blur(8px)' }}>
          <span style={{ fontSize:'10px' }}>{territory.icon}</span>
          <span style={{ fontFamily:"'Cinzel', serif", fontSize:'7px', letterSpacing:'1.5px', color:module.color, textTransform:'uppercase', fontWeight:'700' }}>{territory.label}</span>
        </div>
      </div>
      <div style={{ padding:'14px 16px 18px' }}>
        {(module.propocoins === 0 || module.propocoins === null || !module.propocoins) && !owned && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 10px',
            background: 'linear-gradient(135deg, #0a1a3a, #1a3a6e, #2563a8)',
            borderRadius: '4px',
            border: '1px solid rgba(100,160,255,0.4)',
            borderTop: '1.5px solid rgba(160,210,255,0.8)',
            borderBottom: '1.5px solid rgba(160,210,255,0.8)',
            boxShadow: '0 0 12px rgba(37,99,168,0.7), inset 0 1px 0 rgba(255,255,255,0.15)',
            boxShadow: '0 0 12px rgba(37,99,168,0.6), inset 0 1px 0 rgba(255,255,255,0.15)',
            marginBottom: '6px',
          }}>
            <span style={{ fontSize: '8px' }}>🔵</span>
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: 'clamp(8px, 1.5vw, 10px)', fontWeight: '900', letterSpacing: '3px', color: '#a8d4ff' }}>SIN COSTO</span>
          </div>
        )}
        {module.is_new && !isSeen && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 10px',
            background: 'linear-gradient(135deg, #7b0000, #cc0000, #ff1744)',
            borderRadius: '4px',
            border: '1px solid rgba(255,160,80,0.4)',
            borderTop: '1.5px solid rgba(255,220,150,0.85)',
            borderBottom: '1.5px solid rgba(255,220,150,0.85)',
            boxShadow: '0 0 12px rgba(255,23,68,0.7), inset 0 1px 0 rgba(255,255,255,0.15)',
            animation: 'nuevoSello 2s ease-in-out infinite',
            marginBottom: '6px',
          }}>
            <span style={{ fontSize: '8px' }}>🔴</span>
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: 'clamp(8px, 1.5vw, 10px)', fontWeight: '900', letterSpacing: '3px', color: '#fff' }}>NUEVO</span>
          </div>
        )}
        <div style={{ fontFamily:"'Raleway', sans-serif", fontSize:'10px', fontWeight:'300', letterSpacing:'2.5px', textTransform:'uppercase', color:`rgba(${c.r},${c.g},${c.b},0.85)`, marginBottom:'5px' }}>{module.subtitle}</div>
        <h3 style={{ fontFamily:"'Cinzel', serif", fontSize:'15px', fontWeight:'700', color:'#f0e8ff', letterSpacing:'0.04em', lineHeight:'1.3', marginBottom:'12px', textShadow:hovered?`0 0 20px rgba(${c.r},${c.g},${c.b},0.6)`:'none', transition:'text-shadow 0.3s ease' }}>{module.title}</h3>
        {/* ── PropoCoins button with spinning silver border on card hover ── */}
        <div style={{
          position:'relative', borderRadius:'10px', padding:'1.5px', overflow:'hidden',
          transition:'box-shadow 0.35s ease',
          boxShadow: hovered ? '0 0 22px rgba(200,200,255,0.25), 0 0 8px rgba(180,180,240,0.15)' : 'none',
        }}>
          {/* Rotating silver gradient border */}
          <div style={{
            position:'absolute', top:'-100%', left:'-100%',
            width:'300%', height:'300%',
            background:'conic-gradient(from 0deg, transparent 0deg, rgba(180,180,220,0.4) 40deg, rgba(230,230,255,0.85) 70deg, #ffffff 90deg, rgba(230,230,255,0.85) 110deg, rgba(180,180,220,0.4) 140deg, transparent 180deg)',
            boxShadow: '0 0 12px rgba(37,99,168,0.6), inset 0 1px 0 rgba(255,255,255,0.15)',
            opacity: hovered ? 1 : 0,
            transition:'opacity 0.35s ease',
          }} />
          <button style={{
            position:'relative', width:'100%', padding:'9px 0',
            background: owned
              ? 'linear-gradient(135deg, rgba(4,20,10,0.97), rgba(2,12,6,0.97))'
              : hovered
              ? 'linear-gradient(135deg, rgba(10,4,28,0.97), rgba(6,2,18,0.97))'
              : `linear-gradient(135deg, rgba(${c.r},${c.g},${c.b},0.18), rgba(${c.r},${c.g},${c.b},0.08))`,
            border: owned ? '1px solid rgba(34,197,94,0.5)' : hovered ? 'none' : `1px solid rgba(${c.r},${c.g},${c.b},0.35)`,
            borderRadius:'8.5px',
            color: owned ? '#4ade80' : hovered ? 'rgba(220,220,255,0.95)' : `rgba(${c.r},${c.g},${c.b},0.95)`,
            fontFamily:"'Cinzel', serif", fontSize:'8.5px', letterSpacing:'1.5px',
            textTransform:'uppercase', cursor:'pointer',
            transition:'all 0.35s ease',
            display:'flex', alignItems:'center', justifyContent:'center', gap:'5px',
          }}>
            <span style={{ fontSize:'11px', lineHeight:1 }}>{owned ? '✅' : '🪙'}</span>
            {owned ? '✅ OBTENIDO' : 'Canjeable por'}&nbsp;
            <strong style={{
              fontWeight:'900', fontSize:'11px',
              color:'#d0d0ee',
            }}>{module.propocoins ?? '—'}</strong>
            &nbsp;PropoCoins
          </button>
        </div>
      </div>
      <div style={{ position:'absolute', top:0, left:0, width:'40px', height:'40px', background:`radial-gradient(circle at 0 0, rgba(${c.r},${c.g},${c.b},0.3), transparent 70%)`, pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:0, right:0, width:'40px', height:'40px', background:`radial-gradient(circle at 100% 100%, rgba(${c.r},${c.g},${c.b},0.2), transparent 70%)`, pointerEvents:'none' }} />
    </div>
  );
}

// ─────────────────────────────────────────────
//  PARTICLE BG
// ─────────────────────────────────────────────
function ParticleBg() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H, raf;
    const particles = [];
    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    const isMobile = window.innerWidth < 768;
    const count = isMobile ? 22 : 45;
    for (let i = 0; i < count; i++) {
      particles.push({ x:Math.random()*2000, y:Math.random()*2000, r:Math.random()*1.0+0.2, vx:(Math.random()-0.5)*0.09, vy:(Math.random()-0.5)*0.09, a:Math.random()*Math.PI*2 });
    }
    const tick = () => {
      ctx.clearRect(0, 0, W, H);
      particles.forEach(p => {
        p.x+=p.vx; p.y+=p.vy; p.a+=0.004;
        if(p.x<0)p.x=W; if(p.x>W)p.x=0;
        if(p.y<0)p.y=H; if(p.y>H)p.y=0;
        const alpha = (Math.sin(p.a)*0.5+0.5)*0.28+0.04;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle=`rgba(124,58,237,${alpha})`; ctx.fill();
      });
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize',resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:0 }} />;
}

// ─────────────────────────────────────────────
//  TAB BUTTON
// ─────────────────────────────────────────────
function TabButton({ tab, isActive, onClick }) {
  const [hovered, setHovered] = useState(false);
  const ts = TAB_STYLES[tab.id];
  const c = hexToRgb(ts.color);
  return (
    <>
      <style>{`
        @keyframes tabGlow_${tab.id} { 0%,100%{box-shadow:0 0 12px rgba(${c.r},${c.g},${c.b},0.4),0 0 24px rgba(${c.r},${c.g},${c.b},0.2);} 50%{box-shadow:0 0 22px rgba(${c.r},${c.g},${c.b},0.7),0 0 44px rgba(${c.r},${c.g},${c.b},0.35);} }
      `}</style>
      <button
        onClick={() => onClick(tab.id)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position:'relative', padding:'10px 22px', borderRadius:'30px',
          background: isActive ? `linear-gradient(135deg, rgba(${c.r},${c.g},${c.b},0.28), rgba(${c.r},${c.g},${c.b},0.12))` : hovered ? ts.hoverBg : 'rgba(255,255,255,0.03)',
          border: isActive ? `1px solid rgba(${c.r},${c.g},${c.b},0.7)` : hovered ? `1px solid rgba(${c.r},${c.g},${c.b},0.35)` : '1px solid rgba(255,255,255,0.08)',
          color: isActive ? ts.activeText : hovered ? ts.color : 'rgba(255,255,255,0.4)',
          fontFamily:"'Cinzel', serif", fontSize:'10px', letterSpacing:'2.5px', textTransform:'uppercase', cursor:'pointer',
          transition:'all 0.3s cubic-bezier(0.34,1.2,0.64,1)',
          animation: isActive ? `tabGlow_${tab.id} 2.5s ease-in-out infinite` : 'none',
          boxShadow: isActive ? `0 0 20px rgba(${c.r},${c.g},${c.b},0.4), inset 0 1px 0 rgba(255,255,255,0.1)` : 'none',
          transform: isActive ? 'translateY(-2px) scale(1.04)' : hovered ? 'translateY(-1px)' : 'none',
          whiteSpace:'nowrap',
        }}
      >
        <span style={{ marginRight:'6px', fontSize:'12px' }}>{ts.icon}</span>
        {tab.label}
        {isActive && <span style={{ display:'inline-block', width:'5px', height:'5px', borderRadius:'50%', background:ts.color, boxShadow:`0 0 8px ${ts.color}`, marginLeft:'8px', verticalAlign:'middle' }} />}
      </button>
    </>
  );
}

// ─────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────

/**
 * TempleStorePage
 *
 * Props (all optional):
 *   modules      : { todo, claves, victorias, mapas } — arrays of module objects
 *   onModuleClick: (module) => void
 *   loading      : boolean
 */
function updateHubNewStatus(allProducts, seenSet) {
  const cats = ['claves', 'victorias', 'mapas'];
  const current = (() => {
    try { return JSON.parse(localStorage.getItem('templeNewStatus') || '{}'); }
    catch { return {}; }
  })();
  const status = { ...current };

  cats.forEach(cat => {
    const newInCat = allProducts.filter(p => p.is_new && p.category === cat);
    // Solo apaga el badge cuando YA VISTE TODOS — nunca lo reactiva
    if (newInCat.length > 0 && newInCat.every(p => seenSet.has(p.id))) {
      status[cat] = false;
    }
  });

  localStorage.setItem('templeNewStatus', JSON.stringify(status));
  window.dispatchEvent(new CustomEvent('templeNewStatusChanged', { detail: status }));
}
export default function TempleStorePage({
  onModuleClick,
}) {
  const savedTab = localStorage.getItem('storeTab') || 'todo';
  localStorage.removeItem('storeTab');
  const sidebarOpen = useUIStore(s => s.sidebarOpen);
  const [activeTab, setActiveTab] = useState(savedTab);
  const [selectedModule, setSelectedModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState(DEMO_MODULES);
  const [ownedIds, setOwnedIds] = useState(new Set());
  const [seenIds, setSeenIds] = useState(new Set());
  const [successModule, setSuccessModule] = useState(null);

  const { user } = useAuthStore();

  useEffect(() => {
    if (user?.id) missionsService.trackEvent(user.id, 'visit_store');
  }, [user?.id]);

  useEffect(() => {
    const init = async () => {
      try {
        const { storeService } = await import('../../services/store.service');
        const data = await storeService.getProducts();
        if (!data?.length) return;
        const grouped = { todo: [], claves: [], victorias: [], mapas: [] };
        data.forEach(p => {
          const item = {
            id: p.id,
            title: p.name,
            subtitle: (() => {
              const terrs = p.metadata?.territories?.length
                ? p.metadata.territories
                : (p.metadata?.territory ? [p.metadata.territory] : []);
              return terrs.map(t => TERRITORY_MAP[t]?.label || t).join(' · ');
            })(),
            category: p.category,
            territory:   p.metadata?.territory || (p.metadata?.territories?.[0]) || 'mente',
            territories: p.metadata?.territories?.length ? p.metadata.territories : [p.metadata?.territory || 'mente'],
            image: p.asset_url || null,
            color: CATEGORY_CONFIG[p.category]?.color || '#8b5cf6',
            propocoins: p.price_cristales || 0,
            description: p.description || '',
            objectives: p.metadata?.objectives || [],
            rewards:    p.metadata?.rewards    || [],
            benefits:   p.metadata?.benefits   || [],
            content_url: p.content_url || null,
            slug: p.slug,
            unlock_after_days:  p.metadata?.unlock_after_days  || 0,
            unlock_after_hours: p.metadata?.unlock_after_hours || 0,
            release_date:       p.metadata?.release_date       || null,
            is_new:             p.is_new                       || false,
          };
          if (grouped[p.category]) grouped[p.category].push(item);
          grouped.todo.push(item);
        });
        setModules(grouped);

        console.log('USER ID:', user?.id);
        if (user?.id) {
          const orders = await storeService.getUserOrders(user.id);
          console.log('ORDERS:', orders);
          const ids = new Set();
          orders.forEach(o => {
            try {
              const parsed = typeof o.items === 'string' ? JSON.parse(o.items || '[]') : (o.items || []);
    parsed.forEach(i => { if (i.product_id) ids.add(i.product_id); });
            } catch {}
          });
          setOwnedIds(ids);
          const { data: seenData } = await supabase.from('user_seen_products').select('product_id').eq('user_id', user.id);
const seenSet = new Set((seenData || []).map(s => s.product_id));
setSeenIds(seenSet);
updateHubNewStatus(data, seenSet);
        }
      } catch (err) {
        console.error('Error cargando store:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [user?.id, user]);

  const currentModules = modules[activeTab] || [];
  const [selectedTerritory, setSelectedTerritory] = useState(null);
  const [showTutorial, setShowTutorial] = useState(false);

  const handleOpen = async (mod) => {
    setSelectedModule(mod);
    if (onModuleClick) onModuleClick(mod);
    if (user?.id) {
      missionsService.trackEvent(user.id, 'explore_product');
      if (mod.is_new && !seenIds.has(mod.id)) {
        await supabase.from('user_seen_products').upsert(
          { user_id: user.id, product_id: mod.id },
          { onConflict: 'user_id,product_id' }
        );
        setSeenIds(prev => {
  const next = new Set([...prev, mod.id]);
  const allMods = Object.values(modules).flat();
  updateHubNewStatus(allMods, next);
  return next;
});
      }
    }
  };

  const handleSelectTerritory = (territory) => {
    setSelectedTerritory(territory);
  };

  const handleCloseTerritory = () => {
    setSelectedTerritory(null);
  };

  const handleNavigateTerritory = (territory) => {
    setSelectedTerritory(territory);
  };

  const isDesktop = window.innerWidth >= 1024;

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#030014',
      color: '#fff',
      fontFamily: "'Raleway', sans-serif",
      overflowX: 'hidden',
      position: 'relative',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;900&family=Raleway:wght@200;300;400;500;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: rgba(0,0,0,0.3); }
        ::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.4); border-radius: 4px; }
        @keyframes nuevoSello {
          0%, 100% {
            box-shadow: 0 0 18px rgba(255,23,68,0.8), 0 0 40px rgba(255,23,68,0.4), inset 0 1px 0 rgba(255,255,255,0.2);
            filter: brightness(1);
          }
          50% {
            box-shadow: 0 0 28px rgba(255,23,68,1), 0 0 60px rgba(255,80,0,0.7), 0 0 90px rgba(255,23,68,0.3), inset 0 1px 0 rgba(255,255,255,0.35);
            filter: brightness(1.25);
          }
        }
      `}</style>

      <ParticleBg />

      <div style={{ position:'relative', zIndex:10, padding: isDesktop ? '0 28px 100px' : '0 12px 80px' }}>

        {/* ── STAFF + TERRITORY LEGEND ── */}
        <div style={{
          position: 'relative',
          height: 'clamp(260px, 45vw, 520px)',
          marginBottom: '8px',
        }}>
          <StaffCanvas activeTab={activeTab} activeSphereTerritory={selectedTerritory} />
          <TerritoryLegend
            onSelectTerritory={handleSelectTerritory}
            activeTerritory={selectedTerritory}
          />
        </div>

        {/* ── TAB NAVIGATION ── */}
        <nav style={{ display:'flex', justifyContent:'center', gap:'clamp(5px,1.2vw,10px)', marginBottom:'clamp(20px,4vw,40px)', flexWrap:'wrap', padding:'0 clamp(6px,1.5vw,12px)' }}>
          {TABS.map(tab => (
            <TabButton key={tab.id} tab={tab} isActive={activeTab === tab.id} onClick={setActiveTab} />
          ))}
        </nav>

        {/* ── MODULE GRID ── */}
        {loading ? (
          <div style={{ textAlign:'center', padding:'60px 20px', color:'rgba(168,85,247,0.5)', fontFamily:"'Cinzel', serif", letterSpacing:'3px', fontSize:'12px' }}>
            ✦ &nbsp; Cargando módulos del templo... &nbsp; ✦
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(clamp(240px,28vw,320px), 1fr))', gap:'clamp(12px,2.5vw,24px)', padding:'4px 4px 8px' }}>
            {currentModules.map(module => (
              <ModuleCard key={module.id} module={module} onOpen={handleOpen} owned={ownedIds.has(module.id)} isSeen={seenIds.has(module.id)} />
            ))}
          </div>
        )}

        {!loading && currentModules.length === 0 && (
          <div style={{ textAlign:'center', padding:'80px 20px', color:'rgba(168,85,247,0.4)', fontFamily:"'Cinzel', serif", letterSpacing:'2px', fontSize:'12px' }}>
            No hay módulos disponibles en esta sección.
          </div>
        )}
      </div>

      {/* ── MODULE DETAIL OVERLAY ── */}
      {successModule && (
        <div style={{ position:'fixed', inset:0, zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
          <div style={{ background:'linear-gradient(135deg,rgba(34,197,94,0.2),rgba(16,185,129,0.1))', border:'1px solid rgba(34,197,94,0.6)', borderRadius:'20px', padding:'32px 48px', textAlign:'center', boxShadow:'0 0 60px rgba(34,197,94,0.4)', animation:'detailFadeIn 0.4s ease forwards' }}>
            <div style={{ fontSize:'48px', marginBottom:'12px' }}>✅</div>
            <div style={{ fontFamily:"'Cinzel',serif", fontSize:'14px', letterSpacing:'3px', color:'#4ade80', textShadow:'0 0 20px rgba(74,222,128,0.8)' }}>¡MÓDULO DESBLOQUEADO!</div>
            <div style={{ fontFamily:"'Raleway',sans-serif", fontSize:'13px', color:'rgba(200,255,200,0.8)', marginTop:'8px' }}>{successModule}</div>
          </div>
        </div>
      )}
      {selectedModule && (
        <ModuleDetail
  module={selectedModule}
  onClose={() => setSelectedModule(null)}
  ownedIds={ownedIds}
  onRedeemSuccess={(product) => {
    setOwnedIds(prev => new Set([...prev, product.id]));
    setSuccessModule(product.name);
    setTimeout(() => setSuccessModule(null), 4000);
  }}
/>
      )}

      {/* ── TERRITORY DETAIL OVERLAY ── */}
      {selectedTerritory && (
        <TerritoryDetail
          territoryKey={selectedTerritory}
          onClose={handleCloseTerritory}
          onNavigate={handleNavigateTerritory}
        />
      )}

      <button
        onClick={() => setShowTutorial(true)}
        style={{ position:'fixed', bottom:'clamp(14px,3vw,24px)', right:'clamp(14px,3vw,24px)', zIndex:100,
          background:'rgba(212,175,55,0.06)', border:'1px solid rgba(212,175,55,0.45)',
          color:'rgba(255,229,102,0.95)', fontFamily:"'Cinzel',serif", fontSize:11,
          padding:'clamp(8px,1.5vw,10px) clamp(14px,2.5vw,20px)',
          borderRadius:8, cursor:'pointer', letterSpacing:2, opacity:0.4,
          display: window.innerWidth >= 1024 ? 'block' : 'none',
          transition:'opacity 0.2s ease' }}
        onMouseEnter={e => { if(window.innerWidth >= 1024) e.currentTarget.style.opacity='1'; }}
        onMouseLeave={e => { if(window.innerWidth >= 1024) e.currentTarget.style.opacity='0.2'; }}>
        ✦ TUTORIAL
      </button>

      {showTutorial && (
        <TStoreTutorial onComplete={() => setShowTutorial(false)} />
      )}
    </div>
  );
}
