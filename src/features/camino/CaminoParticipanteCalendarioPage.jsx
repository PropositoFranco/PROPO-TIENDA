import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import CaminoVideoPlayer from "./CaminoVideoPlayer";
import CaminoTutorialPlayer from "./CaminoTutorialPlayer";
import CaminoGuionModal from "./CaminoGuionModal";

// =====================================================================
// CalendarioCaminoPage.jsx
// Conversión 1:1 de public/pages/calendario-camino.html a componente React.
// Todo el contenido (28 días, textos, semanas bloqueadas) es el mismo que
// tenías en el HTML — no se inventó ni se quitó ningún día.
//
// NOTA IMPORTANTE (léela antes de pegar):
// El HTML original enlazaba a otras páginas estáticas con <a href="...html">
// (camino-templario.html, pasaporte-templario.html). Como no sé si esas
// páginas ya existen como rutas de React (con react-router) o siguen siendo
// .html sueltos, dejé esos links tal cual (<a href="...">) para que NO se
// rompa nada al pegarlo. Si ya tienes esas páginas como rutas de React,
// avísame y te paso la versión con <Link to="..."> de react-router-dom.
// =====================================================================

const WEEKS = [
  {
    title: "Semana 1",
    phase: "Fase · Cimiento",
    range: "Día 1 – 7",
    days: [
      { day: 1, badge: "reel", format: "Ranking", desc: "Presentas una lista ordenada de opciones dentro de tu tema (de peor a mejor, o al revés) y das tu veredicto final sobre cuál gana." , detalle: { hookTextual: "En la mitad superior de la pantalla, aparece un recuadro de color sólido de alto contraste con texto en negrita: “[Estrategia / Método] EFECTIVO para [resultado deseado del nicho]”. La palabra EFECTIVO (o equivalente de impacto) debe destacar en un color brillante o tamaño superior para captar la atención visual inmediata al deslizar.", hookVisual: "Pantalla dividida en formato vertical (split screen). En la sección superior se muestra un video dinámico o B-roll en movimiento que ejemplifica la estrategia, caso de estudio o problema que se analiza. En la sección inferior, el creador aparece sentado o en su espacio de trabajo sosteniendo un dispositivo (tablet o teléfono), mirando atentamente hacia la pantalla superior mientras reacciona de forma sutil con gestos de interés o aprobación.", contenido: "El Reel aborda el deseo de alcanzar un objetivo específico en el nicho mediante el análisis de un caso de éxito o ejemplo práctico de un tercero. El video de la parte superior desglosa paso a paso cómo se ejecuta esa táctica o solución, mientras el audio (o voz en off explicativa) desglosa la lógica estratégica de por qué funciona. La narrativa guía al espectador desde la curiosidad inicial sobre el método hasta la comprensión de cómo un pequeño ajuste conceptual o técnico puede aplicarse en su propio negocio o vida para obtener resultados similares sin depender de métodos complejos o costosos." } },
      { day: 2, badge: "reel", format: "Versus", desc: "Enfrentas dos opciones, ideas o caminos cara a cara y muestras con evidencia por qué uno le gana al otro." , detalle: { hookTextual: "“Lo que [efecto negativo / mito común] VS. Lo que [efecto positivo / resultado deseado].” (Ejemplo adaptado a finanzas: “Lo que te empobrece VS. Lo que te hace multiplicar tu dinero.” / Ejemplo adaptado a marketing: “Lo que ahuyenta a tus clientes VS. Lo que te genera ventas en automático.”) Aparece en el centro o dividiendo la pantalla en dos zonas principales un texto en grande y en negrita: “Lo que [EFECTO NEGATIVO] VS. Lo que [EFECTO POSITIVO]”. Se utilizan palabras opuestas de alto impacto (ej. Atrasa / Acelera, Malo / Bueno, Empobrece / Enriquece) destacando los dos extremos con colores en contraste durante los primeros 2 segundos.", hookVisual: "El creador aparece sentado o de pie en un encuadre limpio en plano medio. En la parte inferior o a los costados de la pantalla, la interfaz se divide visualmente en dos columnas o áreas claramente marcadas (una para la categoría del mito/error y otra para la de la solución/acierto). Desde el segundo uno, aparecen íconos o recuadros dinámicos con ilustraciones/fotografías que acompañan cada elemento mencionado.", contenido: "El Reel aborda el contraste directo entre decisiones o elementos cotidianos del nicho que la audiencia suele confundir o categorizar mal. A través de una dinámica rápida de listas comparativas, el creador menciona un concepto o elemento popular y desmitifica si realmente ayuda o frena al espectador, explicando en 1 o 2 frases breves la razón detrás de cada clasificación. El Reel lleva al espectador desde la confusión o la falsa creencia sobre sus hábitos hasta la claridad absoluta, cerrando con un llamado a la acción directo que invita a seguir la cuenta." } },
      { day: 3, badge: "carrusel", format: "Niveles / Etapas", desc: "Cuentas tu historia personal como una escalera de etapas — de dónde partiste, qué cambió en cada nivel, dónde estás hoy." , detalle: { contenido: "Cuenta una historia personal de transformación siguiendo una línea de tiempo por edades o etapas. En cada etapa muestra qué estaba haciendo, qué decisión o dificultad enfrentaste, qué cambió a partir de eso y cómo esa experiencia te llevó al punto en el que estás hoy. Cierra con una reflexión que convierta toda la historia en un mensaje inspirador para la audiencia, demostrando que cambiar de camino, empezar de nuevo y equivocarse también forman parte del proceso.", estructura: "Antes → etapa 1 → etapa 2 → etapa 3 → cambio/obstáculo → situación actual → aprendizaje." } },
      { day: 4, badge: "reel", format: "Frente a cámara", desc: "Le hablas directo a la cámara comparando situaciones o herramientas, una tras otra, con un mismo hilo conductor." , detalle: { hookTextual: "En el tercio superior, una frase corta en tipografía limpia de alto contraste: [CONCEPTO PRINCIPAL]: [MOMENTO / FORMA / CONDICIÓN IDEAL] (ejemplo: Vitamina C: en la mañana o después del desayuno). Al lado, un ícono que refuerce esa condición —sol, luna, reloj— durante los primeros 2 segundos.", hookVisual: "Grabas sobre fondo verde (o con el fondo removido) para que los elementos floten a tu lado sin recuadro ni borde. En el segundo 0:00 haces un gesto claro con la mano hacia arriba y a un costado, y ahí mismo aparece el primer producto recortado, acompañado del ícono del “cuándo”. Cada mención nueva entra con su propio gesto: la mano manda, el elemento obedece. Sin el fondo removido el recurso se ve pegado encima y pierde el efecto.", contenido: "El Reel aborda un error común de la audiencia: creer que basta con usar o comprar el producto —o aplicar el hábito— ignorando la variable que decide si funciona (horario, combinación, contexto o momento correcto). Desarrollas una lista rápida, mención por mención, señalando cada elemento del nicho y dictando su regla en una sola frase por ítem, sin explicaciones largas. Cierras invitando a guardar la pieza o a revisar el perfil para más reglas prácticas del sector." } },
      { day: 5, badge: "reel", format: "Fórmula", desc: "Le das a tu audiencia un cálculo simple y accionable: toma un dato que ya tiene, aplícale una operación, y obtén un resultado revelador." , detalle: { hookTextual: "En la parte superior de la pantalla, aparece una pregunta directa en tipografía bold de alto contraste: “¿QUIERES [OBJETIVO / DESEO PRINCIPAL]? 🎯”.", hookVisual: "El creador aparece en primer plano (plano medio) mirando fijamente a la cámara, sosteniendo un micrófono de mano o de solapa para transmitir autoridad. Mientras habla, señala dinámicamente con el dedo hacia el costado de la pantalla donde van apareciendo consecutivamente los números (1, 2, 3, 4, 5) acompañados de operaciones sencillas, datos o conceptos clave que se van iluminando en verde o blanco sobre la pantalla.", contenido: "El Reel aborda el deseo de lograr una meta compleja o un gran resultado en el nicho desglosándolo en una serie de cálculos, reglas o pasos secuenciales numerados (del 1 al 5) que responden directamente a la pregunta planteada en el gancho textual. El creador guía al espectador punto por punto explicando brevemente el porqué de cada cálculo o paso práctico, para luego fundamentar la lógica detrás del método. Concluye conectando ese sistema con una solución descargable o guiada, cerrando con un llamado a la acción directo para que el usuario comente una palabra o número clave en los comentarios y reciba un recurso o guía gratuita." } },
      { day: 6, badge: "carrusel", format: "Storytelling B-Roll", desc: "Narras tu historia de transformación apoyada en imágenes de tu propio proceso — el antes, el momento de quiebre, el después." , detalle: { contenido: "Narra la historia de un personaje desde una situación difícil o un momento de quiebre, mostrando progresivamente los obstáculos, decisiones y experiencias que atravesó hasta transformar su realidad. Cada slide representa un nuevo capítulo de la historia y avanza la narrativa mediante escenas, diálogos y cambios de contexto. La historia debe generar empatía, mantener la tensión y mostrar cómo cada dificultad conecta con el siguiente paso, cerrando con el resultado o aprendizaje que da sentido a todo el recorrido.", estructura: "Contexto → problema → conflicto → obstáculos → decisión → punto de quiebre → transformación → conclusión." } },
      { day: 7, badge: "reel", format: "Pizarra", desc: "Explicas un concepto clave escribiéndolo en vivo sobre una pizarra o pantalla, como si dieras una clase corta." , detalle: { hookTextual: "“Guía definitiva / Filtro rápido para saber si [tomar una decisión / realizar una acción problemática del nicho].” En la parte superior aparece un título directo en mayúsculas y en tipografía bold de alto contraste: “GUÍA DEFINITIVA DE [DECISIÓN / ERROR COMÚN DEL NICHO]”. Palabras clave de alto impacto (ej. DEFINITIVA, ERRORES, MÁSTER) deben destacarse en color naranja, amarillo o rojo.", hookVisual: "Encuadre en plano medio o de acercamiento enfocado en una pizarra (blanca o de cristal) que contiene un diagrama de flujo / árbol de decisión previamente dibujado con marcadores. El esquema presenta preguntas numeradas conectadas por ramas de “Sí” y “No”. En el segundo 0:00, el creador aparece señalando la pizarra con la mano o el marcador, dirigiendo la atención de inmediato hacia el primer nodo del esquema.", contenido: "El Reel aborda la toma de decisiones impulsivas o la falta de criterio claro ante un problema común del nicho, resolviéndolo mediante un mapa de decisión visual en pizarra. El creador recorre secuencialmente cada nivel del diagrama, formulando preguntas de descarte rápidas (1, 2, 3, 4) y siguiendo con el dedo o marcador las rutas según las respuestas del espectador. Cada respuesta incorrecta o riesgosa conduce a un resultado de descarte inmediato, mientras que responder favorablemente a todos los filtros lleva al resultado final deseado, cerrando con un llamado a la acción para seguir la cuenta y aprender más sobre el tema." } },
    ],
  },
  {
    title: "Semana 2",
    phase: "Fase · Cimiento",
    range: "Día 8 – 14",
    days: [
      { day: 8, badge: "reel", format: "Post-it / Pizarra", desc: "Usas notas escritas a mano que vas revelando una por una para construir la idea completa frente al espectador." , detalle: { hookTextual: "[PROBLEMA SILENCIOSO / ERROR INVISIBLE DEL NICHO] que afecta tu [ACTIVO PRINCIPAL / RESULTADO / ÁREA DE IMPACTO]. En el primer post-it (nota adhesiva) se escribe el gancho.", hookVisual: "Plano cenital fijo (top-down view desde arriba) apuntando a una mesa o fondo plano de color claro y limpio (blanco, madera clara o gris). Las manos del creador entran en encuadre sosteniendo y pegando de forma precisa la primera nota adhesiva (post-it) de color llamativo (amarillo o neón) en la parte superior. La entrada de manos y el movimiento físico frenan el scroll de inmediato.", contenido: "El Reel aborda una lista de factores, errores o hábitos invisibles del nicho que pasan desapercibidos pero generan un impacto negativo constante en el espectador. El creador desarrolla el video de forma 100% visual: de forma secuencial y limpia, va pegando uno a uno nuevos post-its debajo del título principal, formando una cuadrícula ordenada donde cada papel contiene una frase o concepto corto (2 a 4 palabras). El desarrollo guía al espectador desde la curiosidad por descubrir la lista completa hasta la toma de conciencia de sus propios hábitos, cerrando con una invitación en el caption a comentar o guardar el Reel." } },
      { day: 9, badge: "reel", format: "Explicación con objeto", desc: "Usas un objeto físico como referencia visual para explicar qué pasa si tu audiencia repite una acción pequeña de forma constante." , detalle: { hookTextual: "¿Cuánto [resultado masivo / dinero / logro] tendrías si [acción pequeña o inversión constante] al [mes / día / semana] hasta [meta de tiempo a largo plazo]? Aparece escrito a mano en un cartel de papel o mediante un texto en recuadro de alto contraste: “Si [ACCIÓN RECURRENTE]... ¿Cuánto [RESULTADO / LOGRO] a los [TIEMPO / EDAD META]?”. Las cifras clave van destacadas en negrita o en un color diferenciado.", hookVisual: "Plano cenital fijo (top-down view) sobre una mesa limpia o superficie de trabajo. En el centro se observa una calculadora física real (o un elemento de medición representativo del nicho) junto a un cartel de papel con el gancho escrito. En el segundo 0:00, el dedo del creador entra en escena señalando la cifra inicial mientras coloca objetos simbólicos o utilería para simular que comenzará un cálculo real e inmediato.", contenido: "El Reel aborda el potencial transformador de tomar decisiones estratégicas constantes frente al estancamiento de mantener métodos tradicionales o pasivos. El creador desarrolla el video mediante una simulación visual comparativa en tres niveles sobre la mesa: 1) el resultado modesto del camino tradicional, 2) una alternativa intermedia, y 3) la estrategia superior que multiplica de forma exponencial el resultado final en la calculadora. Tras esta demostración visual, el video transiciona al creador hablando a cámara para explicar los fundamentos técnicos de por qué esa estrategia es la mejor opción, sus beneficios clave y una advertencia práctica sobre letras pequeñas o errores a evitar, cerrando con una llamada a la acción para solicitar más información por mensaje directo/comentarios." } },
      { day: 10, badge: "carrusel", format: "Carteles", desc: "Desmontas una creencia común de tu nicho con un giro inesperado, cartel por cartel." , detalle: { contenido: "Crea un carrusel basado en una serie de frases que comiencen con “WTF es...”, cuestionando ideas, comportamientos o creencias que la audiencia considera normales. Cada slide presenta una nueva frase breve y contundente, acompañada de una imagen que represente visualmente esa idea. La gracia está en que cada “WTF es...” genere identificación o sorpresa y plantee una perspectiva diferente sobre situaciones cotidianas relacionadas con el nicho.", estructura: "WTF es [creencia 1] → WTF es [creencia 2] → WTF es [creencia 3] → WTF es [creencia 4] → WTF es [creencia 5] → nueva perspectiva." } },
      { day: 11, badge: "reel", format: "Versus textual", desc: "Contrastas en pantalla dividida una excusa típica de tu audiencia contra tu respuesta directa y sin filtro." , detalle: { hookTextual: "En la pantalla dividida verticalmente, se colocan dos textos contrapuestos. En la columna de la izquierda aparece una frase que expresa una excusa/justificación común del nicho: ““No tuve tiempo para [tarea/actividad]”” (imitando el pensamiento del cliente). En la columna de la derecha aparece la contraparte directa en minúsculas: “yo tampoco”.", hookVisual: "Pantalla dividida al 50% en formato vertical (split screen). De un lado (izquierda), se observa una acción pasiva, una mala elección o el hábito cotidiano poco deseable. Del otro lado (derecha), en el mismo encuadre y ángulo, el creador realiza una acción rápida, una alternativa saludable o la solución eficiente que demuestra que sí es posible. El cambio de escena o toma se realiza al ritmo preciso de los golpes de la música.", contenido: "El Reel aborda las excusas más comunes y los pretextos diarios que frenan a la audiencia para alcanzar un objetivo (falta de tiempo, imprevistos, prisa o falta de recursos). Mediante una secuencia rápida de comparaciones en pantalla dividida, el video desmonta una a una las justificaciones habituales mostrando cómo, en la misma situación y con el mismo pretexto, se puede tomar una decisión alineada con los resultados deseados. El desarrollo es 100% dinámico y visual, sin explicaciones habladas, llevando al espectador desde la identificación con sus propias excusas hasta la toma de conciencia de que el resultado depende de la elección consciente." } },
      { day: 12, badge: "reel", format: "Sketch", desc: "Actúas una escena corta mostrando errores comunes que NUNCA debería cometer alguien de tu área durante un momento clave." , detalle: { hookTextual: "Cosas / Conductas / Errores que NUNCA debería [hacer / decir] tu [profesional / prestador de servicio / marca] durante [momento clave / servicio / sesión]. Aparece centrado en pantalla un recuadro o texto flotante de contraste: ““Cosas que NO debería [hacer / decir] tu [PROFESIONAL / SERVICIO]””, complementado con emojis de advertencia (🚩🚩).", hookVisual: "El creador aparece sentado en su entorno de trabajo habitual mirando fijamente a la cámara en plano medio. En los primeros 2 segundos, utiliza gestos marcados con las manos o señalamientos con un objeto para establecer una actitud de seriedad y juzgamiento, mientras el fondo cuenta con una iluminación temática o de color llamativo (ej. luz magenta/roja) que transmite alerta sin perder estética.", contenido: "El Reel aborda la identificación de malas prácticas o límites cruzados en un servicio/profesión, utilizando una dinámica de actuación/roleplay de situaciones. El creador interpreta secuencialmente 3 a 4 ejemplos exagerados o reales de esas malas conductas, cambiando de gestos o utilería rápida mientras aparece un texto en pantalla nombrando cada mala práctica. El desarrollo lleva al espectador desde la risa/identificación con experiencias pasadas hasta la toma de conciencia sobre lo que realmente debe exigir de un profesional de calidad, concluyendo con una llamada a la acción para comentar si les ha sucedido o guardar el video como referencia." } },
      { day: 13, badge: "carrusel", format: "Comparación", desc: "Comparas dos caminos difíciles y demuestras con claridad cuál de los dos realmente vale la pena elegir." , detalle: { contenido: "Presenta una serie de situaciones que requieren esfuerzo y disciplina, pero contrasta el desafío inicial con una consecuencia más difícil de sostener a largo plazo. Cada slide utiliza la estructura “HARD: [acción] / HARDER: [alternativa o consecuencia]”, generando contraste entre ambas opciones. Al final, cambia la perspectiva con una conclusión que invita a elegir conscientemente el camino difícil que te acerca a la vida que quieres, en lugar de quedarte con la dificultad de no intentarlo.", estructura: "HARD: [acción difícil] / HARDER: [consecuencia de no hacerlo] → repetir con diferentes situaciones → reflexión final." } },
      { day: 14, badge: "reel", format: "Frecuencia / Lista", desc: "Entregas una selección de tips poco conocidos que sí funcionan para el resultado que tu audiencia más desea." , detalle: { hookTextual: "[Categoría / Selección] de [tips / trucos / hábitos] [adjetivo disruptivo: raros / inusuales / poco conocidos] que SÍ funcionan para [resultado deseado del nicho]. En el centro de la pantalla aparece una etiqueta o recuadro de texto en tipografía cursiva/bold estilizada: “[TIPS / TRUCOS / HÁBITOS] [ADJETIVO DISRUPTIVO] DE [TEMA] QUE SÍ FUNCIONAN”.", hookVisual: "Plano medio o primer plano en un ambiente limpio, estético y muy bien iluminado. En los primeros 2 segundos, el creador o sus manos realizan una acción física rápida, sensorial y satisfactoria en primer plano demostrando el primer truco desde el segundo 0:00 mientras los objetos del entorno refuerzan la temática del nicho.", contenido: "El Reel aborda una recopilación de soluciones prácticas e inusuales para problemas cotidianos o molestias recurrentes que afectan a la audiencia. El desarrollo utiliza un formato de demostración visual dinámica: para cada punto numerado (1, 2, 3), la cámara muestra en detalle el producto/ingrediente, la preparación y la aplicación exacta mientras la voz en off explica brevemente la lógica detrás de por qué funciona. El video lleva al espectador desde la curiosidad por probar métodos no convencionales hasta la obtención de un catálogo de soluciones fáciles de replicar en casa, concluyendo con una invitación a guardar el video o comentar para más partes del estilo." } },
    ],
  },
  {
    title: "Semana 3",
    phase: "Fase · Atracción",
    range: "Día 15 – 21",
    days: [
      { day: 15, badge: "reel", format: "Carteles", desc: "Otro giro del formato de carteles, esta vez enfocado en una idea distinta de tu nicho." , detalle: { hookTextual: "El Reel no utiliza locución del creador. Utiliza el audio original del clip extraído de la entrevista, donde la figura pública/celebridad declara: “[Frase/Declaración contundente de la figura pública sobre la importancia de X hábito o filosofía en el nicho]”.", hookVisual: "Instrucción de producción: Subir el clip recortado (en formato vertical 9:16) de una entrevista, podcast o evento de una figura pública/celebridad o referente muy reconocido hablando apasionadamente sobre un tema clave de tu nicho. En los primeros 2 segundos debe verse claramente el rostro de la celebridad gesticulando con subtítulos dinámicos en el centro de la pantalla.", contenido: "El Reel aprovecha el fenómeno de autoridad prestada (curación de contenido) mediante un extracto corto de una celebridad o referente hablando sobre una verdad no negociable del nicho. Durante el video, la figura pública explica desde su perspectiva por qué la audiencia debe tomar acción inmediata en ese aspecto de su vida. El desarrollo utiliza esta declaración para validar la filosofía de tu marca personal, llevando al espectador desde la atención que genera la figura pública hasta la toma de conciencia de su propia situación, concluyendo en el caption con una reflexión del creador y un llamado a la acción." } },
      { day: 16, badge: "reel", format: "Reto en tiempo", desc: "Lanzas un pequeño desafío interactivo con una regla clara y un límite de tiempo, invitando a tu audiencia a participar." , detalle: { hookTextual: "[Acción/Comando directo: Activa tu X / Pon a prueba tu Y] + [Presentación de la regla o desafío interactivo en X segundos] + [Condición/Restricción: sin pausar / sin equivocarte]. En los primeros 3 segundos aparece un texto dinámico en mayúsculas de gran tamaño y color brillante: “[COMANDO PRINCIPAL / RETO]”.", hookVisual: "El creador aparece en primer plano (plano medio sentado) señalando fijamente hacia el lente de la cámara con el dedo para interrumpir el scroll. En el segundo 0:00 o 0:01, realiza un gesto dinámico o muestra un objeto simbólico representativo del reto. Inmediatamente, entre el segundo 0:03-0:05, aparece en pantalla una gráfica/matriz interactiva junto a una animación de reloj de arena o cronómetro gigante superpuesto.", contenido: "El Reel aborda una prueba interactiva en tiempo real que convierte al espectador de consumidor pasivo a participante activo, disparando los tiempos de reproducción y los comentarios. El creador plantea las reglas en menos de 10 segundos, activa un temporizador visible en pantalla (ej. de 30 a 15 segundos) y deja que la matriz/desafío permanezca sola en pantalla mientras el cronómetro avanza, forzando al usuario a concentrarse sin deslizar ni pausar. El video concluye pidiendo al espectador que comente en qué número o nivel se quedó o cuánto tiempo tardó en resolverlo para comparar resultados con la comunidad." } },
      { day: 17, badge: "carrusel", format: "Galería Premium", desc: "Compartes una selección curada de recursos o recomendaciones enfocadas en un resultado específico." , detalle: { contenido: "Organiza una selección de elementos relacionados con una misma categoría o resultado. Cada slide presenta una categoría principal y muestra varios recursos, opciones, herramientas o recomendaciones que pueden ayudar a conseguir ese resultado. La estructura debe ser “Para [resultado/categoría]: [lista de elementos recomendados]”, creando diferentes grupos según las necesidades de la audiencia. Cierra con una invitación a seguir la cuenta para recibir más recomendaciones o contenido práctico relacionado con el nicho.", estructura: "Para [objetivo 1]: recurso 1 + recurso 2 + recurso 3 + recurso 4. Para [objetivo 2]: recurso 1 + recurso 2 + recurso 3 + recurso 4. Para [objetivo 3]: recurso 1 + recurso 2 + recurso 3 + recurso 4. Para [objetivo 4]: recurso 1 + recurso 2 + recurso 3 + recurso 4. Cierre: “Sígueme para más tips/recomendaciones/recursos como estos.”" } },
      { day: 18, badge: "reel", format: "Frente a cámara", desc: "Hablas directo con un gancho textual fuerte que abre el video desde el segundo cero." , detalle: { hookTextual: "“🗣️ Hago [ACCIÓN HABITUAL]... pero [SÍNTOMA QUE NO SE VA]. [CONSECUENCIA EN EL DÍA A DÍA]” — la frase entra en el segundo 0:00 como burbuja de mensaje encima de la infografía, antes de que se dibuje ningún bloque. (Ejemplo: “🗣️ Duermo 8 horas... pero me levanto igual de cansado. Mi cuerpo no responde, mi mente está lenta.”)", hookVisual: "Arranca en la infografía a pantalla completa, no en tu cara. En el frame 1 solo se ve el título-promesa grande —LA VERDADERA CAUSA DE [PROBLEMA]— y la burbuja del comentario encima. Entre el segundo 1 y el 2 aparece el primer bloque con su ícono y su etiqueta, y de ahí los bloques se van encendiendo uno por uno, unidos por flechas o numeración que ordenan la lectura. Tú vas en voz en off (o en un recuadro pequeño en una esquina): la pantalla es del gráfico.", contenido: "El Reel aborda una duda recurrente o una frustración común de quien no logra resolver su problema aplicando las soluciones obvias. En vez de explicarlo frente a cámara, lo desarmas en una infografía de 3 o 4 bloques: bloque 1, lo que la mayoría cree que causa el problema; bloque 2, el principio o estudio del rubro que desmonta esa creencia; bloque 3, la causa raíz real; bloque 4, el primer ajuste concreto que sí la ataca. Un solo dato por bloque, sin párrafos. Cierras invitando a guardar el video para tener el gráfico a la mano, y dejas en el caption la reflexión profunda o el llamado a agendar una sesión." } },
      { day: 19, badge: "reel", format: "Versus textual", desc: "Pantalla dividida mostrando la acción recomendada contra la acción que hay que evitar, con etiquetas visibles todo el video." , detalle: { hookTextual: "En la parte superior de la pantalla, dividida verticalmente en dos columnas, aparecen dos etiquetas de texto contrapuestas desde el segundo 0:00: “[ACCIÓN RECOMENDADA / PERMITIR]” de un lado y “[ACCIÓN DAÑINA / EVITAR]” del otro (por ejemplo: “Permitir emociones | Evitar emociones”). El texto se mantiene visible como encabezado durante toda la demostración.", hookVisual: "Demostración física y metafórica frente a cámara utilizando el mismo objeto/elemento en dos comportamientos opuestos. Por un lado, se realiza la acción adecuada de forma fluida y controlada (ej. servir líquido en un vaso inclinándolo suavemente). Por el otro lado, se ejecuta la acción forzada o mala práctica (ej. intentar tapar o bloquear la botella mientras se agita, provocando un desastre). El contraste entre el orden y el caos visual frena el scroll de inmediato.", contenido: "En este video explicas una idea o lección importante usando una demostración práctica. Muestras dos formas de actuar: intentar tapar o bloquear algo a la fuerza (lo que provoca un desastre y que todo se salga de control) versus hacerlo con calma y de la forma correcta (lo que mantiene el orden). El video le enseña al espectador que el problema no es la situación en sí, sino cómo reacciona ante ella, y termina invitándolo a leer la descripción para ver cómo aplicarlo en su día a día." } },
      { day: 20, badge: "carrusel", format: "Comparación", desc: "Inviatas a dejar de hacer algo que parece necesario, para empezar a hacer lo que realmente mueve el resultado." , detalle: { contenido: "Presenta una serie de falsas necesidades o reglas que la audiencia cree que debe cumplir para conseguir un determinado resultado y contrástalas con lo que realmente necesita. Cada slide utiliza la estructura “No necesitas [creencia/exigencia] → necesitas [alternativa más realista y efectiva]”. Las comparaciones deben abordar diferentes aspectos relacionados con el mismo objetivo, desmontando expectativas poco realistas y reemplazándolas por principios más simples, sostenibles y aplicables.", estructura: "No necesitas: [regla, obligación o creencia popular] / Necesitas: [lo que realmente importa]. No necesitas: [segunda creencia] / Necesitas: [alternativa]." } },
      { day: 21, badge: "reel", format: "B-roll narrado", desc: "Con imágenes de apoyo, dejas claro que a nadie externo le importa qué tan rápido logres tu meta — solo a ti." , detalle: { hookTextual: "A [entidad/institución del nicho] no le importa que tan rápido [logres una meta/resultado de la audiencia].", hookVisual: "El creador aparece frente a cámara (plano medio) gesticulando con seguridad. Para reforzar la retención inicial desde el segundo 0:00, se superpone una captura de pantalla, imagen ilustrativa o gráfico en la parte superior que muestra la entidad o el problema mencionado (ej. el logo del banco, una casa, o un contrato).", contenido: "El Reel aborda una verdad incómoda sobre cómo una entidad o sistema se beneficia del desconocimiento de la gente. En este video explicas de forma muy clara la diferencia entre el camino tradicional (donde la audiencia pierde dinero, tiempo o esfuerzo debido a los intereses de esa entidad) versus una estrategia inteligente que pocos aplican para tomar el control. Muestras con ejemplos o números cómo un pequeño ajuste en la estrategia te ahorra años de esfuerzo o miles de dólares, y concluyes invitando al espectador a comentar o revisar el enlace de tu perfil." } },
    ],
  },
  {
    title: "Semana 4",
    phase: "Fase · Atracción",
    range: "Día 22 – 28",
    days: [
      { day: 22, badge: "reel", format: "Sketch", desc: "Muestras qué se pierde tu audiencia si no aplica una acción o herramienta clave que tú ya dominas." , detalle: { hookTextual: "Si no le das/haces [acción o herramienta clave] a [público objetivo/hijos/clientes]... te estás perdiendo de [gran beneficio / lección transformadora]. En el centro o tercio superior aparecen subtítulos dinámicos de alto impacto: “SI NO [ACCIÓN O PRÁCTICA HABITUAL]... Te estás perdiendo de [GRAN BENEFICIO / LECCIÓN] 💡”.", hookVisual: "Interacción o representación en pareja / actuada frente a cámara entre dos personas en un entorno cotidiano o de hogar. En el segundo 0:00, se muestra una acción física directa de intercambio (como entregar o simular la entrega de un objeto, tarjeta o dinero), acompañada de miradas directas y gestos de conversación real que enganchan por cercanía.", contenido: "Explicas de forma muy sencilla por qué una acción cotidiana tradicional (como dar un recurso, dinero o responsabilidad) sirve como un laboratorio real para cometer errores en pequeño antes de enfrentarse a decisiones grandes. Muestras el paso a paso o las reglas simples para implementar este hábito sin complicarse, y concluyes invitando al espectador a guardar el video o leer la descripción para ver la guía completa de cómo aplicarlo hoy mismo." } },
      { day: 23, badge: "reel", format: "Frente a cámara", desc: "Respondes una duda inusual de tu nicho con un \"sí, y además...\" que abre una oportunidad que casi nadie ve." , detalle: { hookTextual: "¿Es legal / permitido [ACCIÓN INUSUAL DEL NICHO]? Sí. Y mientras la mayoría hace esto —[el camino largo]—, quien lo sabe hace esto otro. Dos rótulos fijos desde el segundo 0:00: “EL CAMINO DE TODOS ⏳ [TIEMPO / COSTO LARGO]” y “LO QUE SÍ ESTÁ PERMITIDO ⚡ [TIEMPO / COSTO CORTO]”.", hookVisual: "Arranca con un cronómetro corriendo en pantalla y el sticker de verificación verde (✔️) sobre la pregunta “¿ES LEGAL?”. Primero se ejecuta el camino lento en tiempo real y sin piedad: el papeleo, la fila, las llamadas, exagerando el tedio con cortes secos mientras el cronómetro sigue subiendo. Corte seco al método permitido: la misma meta resuelta en pocos pasos, con el cronómetro casi quieto. En el clímax los dos tiempos aparecen juntos en pantalla.", contenido: "El Reel aborda una duda legal, técnica o un tabú que la mayoría desconoce en el nicho. La tesis es que esa acción no solo es completamente legal o correcta, sino que es la vía corta a un problema que casi todos resuelven por la vía larga. Muestras las dos rutas hacia el mismo objetivo —la tradicional, con su costo real en tiempo, dinero o trámites, y la permitida, con sus requisitos básicos— y dejas la diferencia explícita con números en pantalla. Cierras con los 2 o 3 requisitos para hacerlo bien sin cometer errores, e invitas a guardar el video o escribir en comentarios si su caso es distinto." } },
      { day: 24, badge: "carrusel", format: "Carteles", desc: "Presentas tu filosofía o concepto insignia junto con los principios clave de tu estilo de trabajo, cerrando con tu oferta." , detalle: { contenido: "Presenta una serie de situaciones cotidianas, hábitos o principios que definen lo que significa adoptar una filosofía específica en tu nicho. La clave absoluta es que cada slide comience de forma obligatoria con la frase “Kinda chic es...”. Esta repetición constante funciona como mantra e hilo conductor, generando empatía e identidad de marca inmediata. En los slides finales, conectas de manera natural esa filosofía con tu producto o recurso, demostrando que es la herramienta clave para vivir ese estilo de vida. Cierras con un llamado a la acción basado en una palabra clave para automatizar ventas en los comentarios.", estructura: "Slide 1: “Kinda chic es [principio 1].” Slide 2: “Kinda chic es [principio 2].” Slide 3: “Kinda chic es [principio 3] + mención sutil de logro o recurso.” Slide 4-5: más principios. Slide 6 (Revelación del producto): “Y ahora [tu producto] está en versión [Ebook / Curso / Plantilla] + recurso extra.” Slide 7 (Demostración visual): plantilla/bonus complementario + captura o mock-up. Slide 8 (Call to action): “Comentá [PALABRA CLAVE] y te paso el link.”" } },
      { day: 25, badge: "reel", format: "Versus + pizarra en blanco", desc: "Arrancas con un gancho puramente visual antes de decir una sola palabra." , detalle: { hookTextual: "El creador aparece de pie junto a una pizarra dividida verticalmente en dos columnas claras con los dos perfiles/conceptos a comparar ([Perfil A] vs. [Perfil B]).", hookVisual: "En el segundo 0:00, el creador realiza un movimiento físico dinámico sacando o pegando la primera tarjeta/cartel sobre el lado de [Perfil A], captando la atención visual de inmediato mediante la acción física.", contenido: "El Reel es una comparación rápida y punto por punto entre dos formas de actuar en el nicho (una incorrecta/mediocre vs. una excelente/proactiva). En este video explicas de forma muy clara las diferencias clave usando la pizarra: para cada punto, dices primero lo que hace el perfil A mientras muestras o pegas su tarjeta en su columna, y luego dices y muestras la contraparte del perfil B en su respectiva columna. El contenido le enseña al espectador de manera super directa cómo detectar un mal comportamiento y cuál es la alternativa correcta, concluyendo al terminar todos los puntos con una invitación a guardar el video o comentar." } },
      { day: 26, badge: "reel", format: "Pantalla dividida + pizarra digital", desc: "Desenmascaras algo que parece virtuoso pero en realidad es un error común que casi todos cometen." , detalle: { hookTextual: "Esto no es [concepto virtuoso/deseado], es [problema/error real]...", hookVisual: "Encuadre en pantalla dividida horizontalmente: en la mitad superior se muestra un esquema, lienzo o collage digital con un grupo de elementos/imágenes que representan el “ideal o la fachada” del tema. En la mitad inferior, el creador aparece mirando hacia arriba y señalando directamente con la mano hacia ese grupo de imágenes desde el segundo 0:00 para desmentir lo que representan.", contenido: "El Reel desmiente la creencia de que cumplir con hábitos superficiales o “estéticos” significa estar avanzando de verdad. En este video explicas de forma muy sencilla cómo llenar tu tiempo con tareas secundarias es solo una trampa del cerebro para evitar la única acción importante que genera resultados (por miedo, incomodidad o pereza). Muestras el contraste entre aparentar progreso y ejecutar lo que realmente importa, y concluyes con un llamado a la acción directo pidiéndole al espectador que comente una palabra clave para enviarle un recurso o guía privada con la solución." } },
      { day: 27, badge: "carrusel", format: "Escalas / Timeline", desc: "Cuentas un proceso de transformación a lo largo del tiempo, con evidencia y un cierre que invita a la acción." , detalle: { contenido: "Narra una historia de transformación personal o profesional a lo largo de un período de tiempo determinado (por ejemplo, 1 o 2 años). Se inicia mostrando la vulnerabilidad de los comienzos sin audiencia ni resultados, se presenta el punto de inflexión o pivote estratégico, se muestra la prueba social innegable mediante métricas y resultados reales (ingresos, vistas, alianzas), y concluye con una reflexión motivacional que invita a la audiencia a dar el primer paso.", estructura: "Slide 1 (Gancho + tiempo invertido): “Le dediqué [X tiempo] a [plataforma/habilidad]... Aquí está lo que me devolvió.” Slide 2 (Los comienzos): “[Año de inicio]: Publiqué/empecé mi primer [contenido/proyecto]. No tenía audiencia ni idea de lo que hacía.” Slide 3 (Fase difícil): “[Un año después]: Los resultados seguían siendo dolorosamente lentos.” Slide 4 (Pivote estratégico): “Decidí cambiar el enfoque y empezar a compartir lo que realmente funciona.” Slide 5 (Primer gran hito): “En [mes/año] logré [primer gran hito].” Slide 6 (Situación actual): “[X años después]... Esto fue lo que logré.” Slide 7 (Prueba social): “Miles de seguidores/alumnos/clientes.” Slide 8 (Prueba financiera): “Ingresos mensuales recurrentes mediante [fuentes de ingreso].” Slide 9 (Alianzas): “Crear contenido me abrió las puertas a trabajar con marcas increíbles.” Slide 10 (Cierre inspirador): “Si hay algo con lo que has estado soñando, empieza hoy.”" } },
      { day: 28, badge: "reel", format: "Pantalla verde", desc: "Muestras cómo era antes un método o proceso, cómo funciona ahora, y quién lo está ejecutando mejor hoy." , detalle: { hookTextual: "Así es como [método/herramienta/proceso] solía funcionar, así es como funciona hoy, y esta es una de las mejores [marcas / referentes / empresas] ejecutándolo a la perfección.", hookVisual: "El creador aparece en primer plano (plano medio o medio corto) grabado frente a una pantalla verde (green screen). Durante los primeros 3 a 5 segundos, el fondo gráfico va cambiando aceleradamente tras cada coma o pausa de la frase: primero el diagrama del método antiguo, luego el gráfico del sistema actual y finalmente capturas/ejemplos reales de la marca de referencia.", contenido: "El Reel aborda la evolución de una estrategia en el nicho, desmintiendo prácticas obsoletas que la mayoría sigue usando por inercia. En este video explicas de forma muy sencilla por qué el método antiguo ya no da resultados, y cómo el enfoque moderno se centra en simplificar la estructura para darle prioridad a la calidad del contenido/mensaje. Muestras en pantalla verde ejemplos reales de cómo esa marca de referencia aplica la nueva estrategia, desglosando brevemente los elementos que la hacen funcionar." } },
    ],
  },
];

const BADGE_META = {
  reel: { icon: "🎬", label: "REEL" },
  carrusel: { icon: "📑", label: "CARRUSEL" },
};

const PHASE_ICONS = {
  "Fase · Cimiento": "🏛️",
  "Fase · Atracción": "🧲",
  "Fase · Prueba social": "🔥",
  "Fase · Cierre": "🏆",
};

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="var(--gold-bright)">
      <polygon points="6,3 21,12 6,21" />
    </svg>
  );
}

function DayCard({ day, badge, format, desc, detalle }) {
  const meta = BADGE_META[badge];
  const [abierto, setAbierto] = useState(false);
  const [guionAbierto, setGuionAbierto] = useState(false);

  return (
    <div className="day-card">
      <div className="day-top">
        <div className="day-label">DÍA {day}</div>
        <div className={`format-badge ${badge}`}>
          {meta.icon} {meta.label}
        </div>
      </div>
      <div className="day-format">{format}</div>
      <div className="day-desc">{desc}</div>
      <CaminoVideoPlayer diaNumero={day} />

      <button
        type="button"
        className="idea-btn"
        onClick={() => setGuionAbierto(true)}
      >
        <span>🪄 Generar Guion con IA</span>
      </button>

      {guionAbierto && (
        <CaminoGuionModal formato={format} onClose={() => setGuionAbierto(false)} />
      )}

      {detalle && (
        <>
          <button
            type="button"
            className="idea-btn"
            onClick={() => setAbierto((v) => !v)}
            aria-expanded={abierto}
          >
            <span>📄 Ver la idea completa</span>
            <span className={`idea-chevron ${abierto ? "open" : ""}`}>▾</span>
          </button>

          {abierto && (
            <div className="idea-panel">
              {detalle.hookTextual && (
                <div className="idea-block">
                  <div className="idea-label">Hook textual</div>
                  <p className="idea-text">{detalle.hookTextual}</p>
                </div>
              )}
              {detalle.hookVisual && (
                <div className="idea-block">
                  <div className="idea-label">Hook visual</div>
                  <p className="idea-text">{detalle.hookVisual}</p>
                </div>
              )}
              {detalle.contenido && (
                <div className="idea-block">
                  <div className="idea-label">Contenido</div>
                  <p className="idea-text">{detalle.contenido}</p>
                </div>
              )}
              {detalle.estructura && (
                <div className="idea-block">
                  <div className="idea-label">Estructura</div>
                  <p className="idea-text">{detalle.estructura}</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function LockedWeek({ title }) {
  return (
    <div className="locked-week">
      <div className="locked-left">
        <div className="locked-icon">🔒</div>
        <div className="locked-txt">
          <b>{title.heading}</b>
          <span>{title.body}</span>
        </div>
      </div>
      <div className="locked-cta">Se arma al llegar →</div>
    </div>
  );
}

export default function CalendarioCaminoPage() {
  const navigate = useNavigate();
  // Genera las estrellas del fondo, igual que el <script> del HTML original
  const stars = useMemo(() => {
    const n = typeof window !== "undefined" && window.innerWidth < 760 ? 40 : 80;
    return Array.from({ length: n }, () => ({
      size: (Math.random() * 1.5 + 0.6).toFixed(1),
      top: (Math.random() * 100).toFixed(1),
      left: (Math.random() * 100).toFixed(1),
      dur: (Math.random() * 4 + 3).toFixed(1),
      delay: (Math.random() * 4).toFixed(1),
      min: (Math.random() * 0.4 + 0.15).toFixed(2),
    }));
  }, []);

  // Carga las fuentes de Google Fonts que usaba el <head> del HTML original
  useEffect(() => {
    const links = [
      "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Cinzel+Decorative:wght@700;900&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap&font-display=swap",
      "https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;900&display=swap&font-display=swap",
    ];
    const created = links.map((href) => {
      const el = document.createElement("link");
      el.rel = "stylesheet";
      el.href = href;
      document.head.appendChild(el);
      return el;
    });
    return () => created.forEach((el) => document.head.removeChild(el));
  }, []);

  return (
    <div className="calendario-camino-page">
      <style>{CSS}</style>

      <div className="cc-bg-fx">
        <div className="cc-tone-layer"></div>
        <div className="cc-orb cc-orb-gold"></div>
        <div className="cc-orb cc-orb-purple"></div>
        <div className="cc-orb cc-orb-teal"></div>
      </div>

      <div className="stars">
        {stars.map((s, i) => (
          <div
            key={i}
            className="star"
            style={{
              width: `${s.size}px`,
              height: `${s.size}px`,
              top: `${s.top}%`,
              left: `${s.left}%`,
              "--d": `${s.dur}s`,
              "--del": `${s.delay}s`,
              "--min": s.min,
            }}
          />
        ))}
      </div>

      <nav className="topnav">
        <div className="brand">
          <svg className="brand-seal temple-icon" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
            <polygon points="32,4 58,22 6,22" className="gold" />
            <rect x="9" y="24" width="5" height="30" className="gold-mid" />
            <rect x="20" y="24" width="5" height="30" className="gold-mid" />
            <rect x="29.5" y="24" width="5" height="30" className="gold" />
            <rect x="39" y="24" width="5" height="30" className="gold-mid" />
            <rect x="50" y="24" width="5" height="30" className="gold-mid" />
            <rect x="6" y="54" width="52" height="5" className="gold" />
            <circle cx="32" cy="13" r="2.6" fill="#04020e" />
          </svg>
          <div className="brand-name">
            TEMPLO <span>DEL PROPÓSITO</span>
          </div>
        </div>
        <div className="nav-links">
          <button className="nav-item" onClick={() => navigate('/camino/participante/home')}>Inicio</button>
          <button className="nav-item" onClick={() => navigate('/camino/participante/panel')}>Check-in</button>
          <span className="nav-item active">Calendario</span>
          <button className="nav-item" onClick={() => navigate('/camino/participante/pasaporte')}>Pasaporte del Templario</button>
          <button className="nav-item" onClick={() => navigate('/camino/participante/ranking')}>Ranking</button>
        </div>
        <select className="nav-select">
          <option>Camino a Líder Digital · Gen. Agosto</option>
        </select>
      </nav>

      <div className="cc-hero">
        <div className="cc-hero-inner">
          <div className="header-row cc-hero-header">
            <div className="header-icon">🗓️</div>
            <div>
              <div className="eyebrow-tag">TU RUTA DE CONTENIDO</div>
              <h1 className="page-title">Calendario del Camino</h1>
            </div>
          </div>
        </div>
        <div className="cc-hero-mascot"></div>
      </div>

      <div className="wrap cc-wrap-with-mascot">
        <div className="cc-story">
          <div className="cc-story-ornament">✦</div>
          <p className="page-sub">
            Lo que te toca publicar cada día: formato, gancho e idea completa. Empieza en tu{" "}
            <b style={{ color: "var(--gold-bright)" }}>Día 1</b> el día que arrancas — no importa la fecha del
            calendario, todos los templarios recorren la misma ruta.
          </p>
        </div>

        <div className="progress-strip">
          <div className="txt">
            Plan mínimo: <b>28 días</b> (Cimiento + Atracción). Si decides continuar, el camino sigue hasta el{" "}
            <b>Día 60</b> (Prueba social + Cierre).
          </div>
          <div className="milestone-pill">Día 1 = tu fecha de inicio</div>
        </div>

        {WEEKS.map((week) => (
          <div className="week-block" key={week.title}>
            <div className="week-head">
              <div className="week-medal">{PHASE_ICONS[week.phase] || "⚜️"}</div>
              <div>
                <div className="week-title">{week.title}</div>
                <div className="week-phase-row">
                  <span className="week-phase">{week.phase}</span>
                  <span className="week-range">{week.range}</span>
                </div>
              </div>
            </div>
            <div className="cc-timeline">
              {week.days.map((d, idx) => (
                <div className={`cc-timeline-row ${idx % 2 === 0 ? "left" : "right"}`} key={d.day}>
                  <div className="cc-timeline-node">{d.day}</div>
                  <DayCard {...d} />
                </div>
              ))}
            </div>
            {week.title === "Semana 4" && (
              <div style={{ marginTop: "16px" }} className="progress-strip">
                <div className="txt">
                  🏁 <b>Día 28 completado = Plan mínimo cumplido.</b> Aquí el templario decide con su líder si
                  continúa hasta el Día 60.
                </div>
              </div>
            )}
          </div>
        ))}

        <div className="week-block">
          <div className="week-head">
            <div className="week-medal">🔥</div>
            <div>
              <div className="week-title">Semana 5 – 6</div>
              <div className="week-phase-row">
                <span className="week-phase">Fase · Prueba social</span>
                <span className="week-range">Día 29 – 42</span>
              </div>
            </div>
          </div>
          <LockedWeek
            title={{
              heading: "Segunda vuelta de formatos, misma técnica con historia nueva",
              body: "Se desbloquea al completar el Día 28. Aquí documentas resultados y casos propios usando los mismos formatos, con un ángulo de prueba social.",
            }}
          />
        </div>

        <div className="week-block">
          <div className="week-head">
            <div className="week-medal">🏆</div>
            <div>
              <div className="week-title">Semana 7 – 8</div>
              <div className="week-phase-row">
                <span className="week-phase">Fase · Cierre</span>
                <span className="week-range">Día 43 – 60</span>
              </div>
            </div>
          </div>
          <LockedWeek
            title={{
              heading: "Oferta directa a tu audiencia",
              body: "Se desbloquea al completar la Semana 6. Cierre del camino: ofertas, testimonios y llamados a la acción directos.",
            }}
          />
        </div>

        <div className="footer-note">
          Cada tarjeta lleva su propio video tutorial en Bunny.net — se va activando conforme se graban.
          <br />
          Este calendario corre desde el día en que tú arrancas, no desde una fecha fija de generación.
        </div>
      </div>
    </div>
  );
}

// CSS original del HTML, sin cambios de diseño — solo se movió a un template string.
const CSS = `
.calendario-camino-page{
  --gold:#D4AF37; --gold-bright:#FFE566; --gold-dim:rgba(212,175,55,0.4); --gold-glow:rgba(212,175,55,0.65);
  --dark-bg:#04020e; --dark-surface:rgba(10,5,32,0.92);
  --purple:#CC44FF; --purple-glow:rgba(204,68,255,0.5);
  --lilac:rgba(200,185,240,0.7); --lilac-dim:rgba(200,185,240,0.42);
  min-height:100dvh; width:100%; font-family:'Crimson Text',serif; color:#fff; position:relative;
  background:
    radial-gradient(ellipse 120% 40% at 50% 0%, rgba(40,10,90,0.9) 0%, transparent 60%),
    radial-gradient(ellipse 70% 30% at 12% 10%, rgba(10,40,100,0.3) 0%, transparent 55%),
    radial-gradient(ellipse 70% 30% at 88% 8%, rgba(80,10,110,0.3) 0%, transparent 55%),
    linear-gradient(180deg,#050215 0%,#0a0530 12%,#08031c 30%,#04020e 60%,#04020e 100%);
}
.calendario-camino-page *,.calendario-camino-page *::before,.calendario-camino-page *::after{box-sizing:border-box;}
.calendario-camino-page .stars{position:fixed; inset:0; pointer-events:none; z-index:0;}
.calendario-camino-page .star{position:absolute; border-radius:50%; background:#fff; animation:cc-twinkle var(--d) ease-in-out infinite; animation-delay:var(--del);}
@keyframes cc-twinkle{0%,100%{opacity:var(--min);} 50%{opacity:1;}}
@media (prefers-reduced-motion: reduce){ .calendario-camino-page *{animation:none !important; transition:none !important;} }
.calendario-camino-page .temple-icon .gold{stroke:var(--gold-bright); fill:var(--gold-bright);}
.calendario-camino-page .temple-icon .gold-mid{stroke:var(--gold); fill:var(--gold);}

.calendario-camino-page .topnav{
  position:sticky; top:0; z-index:20;
  display:flex; align-items:center; justify-content:space-between; gap:14px;
  padding:10px 26px;
  background:linear-gradient(180deg, rgba(6,3,18,0.98), rgba(6,3,18,0.94));
  border-bottom:1px solid var(--gold-dim);
  backdrop-filter:blur(8px);
}
.calendario-camino-page .brand{display:flex; align-items:center; gap:10px;}
.calendario-camino-page .brand-seal{width:32px; height:32px; flex-shrink:0; filter:drop-shadow(0 0 8px var(--gold-glow));}
.calendario-camino-page .brand-name{font-family:'Cinzel',serif; font-weight:900; letter-spacing:1px; font-size:17px; color:#fff;}
.calendario-camino-page .brand-name span{color:var(--gold);}
.calendario-camino-page .nav-links{display:flex; align-items:center; gap:22px; flex-wrap:nowrap;}
.calendario-camino-page .nav-item{
  font-family:'Cinzel',serif; font-size:13.5px; font-weight:700; letter-spacing:0.3px;
  color:var(--lilac); text-decoration:none; white-space:nowrap; opacity:0.85; transition:opacity .2s, color .2s;
}
.calendario-camino-page .nav-item:hover{opacity:1; color:var(--gold-bright);}
.calendario-camino-page .nav-item.active{color:var(--gold-bright); opacity:1;}
.calendario-camino-page .nav-select{
  font-family:'Cinzel',serif; font-size:13px; font-weight:700; color:#fff;
  background:rgba(212,175,55,0.1); border:1px solid var(--gold-dim); border-radius:8px;
  padding:8px 14px; white-space:nowrap; max-width:240px; overflow:hidden; text-overflow:ellipsis;
}
@media (max-width:860px){
  .calendario-camino-page .topnav{padding:8px 14px; flex-wrap:wrap; row-gap:8px;}
  .calendario-camino-page .nav-links{flex-wrap:wrap; gap:10px 14px;}
  .calendario-camino-page .nav-item{font-size:10.5px;}
  .calendario-camino-page .nav-select{margin-left:auto; font-size:11.5px; padding:6px 10px; max-width:180px;}
}

.calendario-camino-page .cc-bg-fx{position:fixed; inset:0; z-index:0; pointer-events:none; overflow:hidden;}
.calendario-camino-page .cc-tone-layer{
  position:absolute; inset:-10%;
  background:
    radial-gradient(ellipse 70% 55% at 50% 0%, rgba(80,10,110,0.4) 0%, transparent 62%),
    radial-gradient(ellipse 55% 45% at 15% 60%, rgba(212,175,55,0.08) 0%, transparent 60%),
    radial-gradient(ellipse 55% 45% at 85% 85%, rgba(120,220,210,0.08) 0%, transparent 60%);
  animation:cc-hero-tone 18s ease-in-out infinite alternate;
}
@keyframes cc-hero-tone{
  0%{ filter:hue-rotate(0deg) brightness(1); }
  100%{ filter:hue-rotate(16deg) brightness(1.1); }
}
.calendario-camino-page .cc-orb{position:absolute; border-radius:50%; filter:blur(40px); animation:cc-orb-float ease-in-out infinite;}
.calendario-camino-page .cc-orb-gold{width:200px; height:200px; background:rgba(212,175,55,0.3); top:6%; left:5%; animation-duration:14s;}
.calendario-camino-page .cc-orb-purple{width:260px; height:260px; background:rgba(204,68,255,0.24); top:38%; right:6%; animation-duration:18s; animation-delay:1.2s;}
.calendario-camino-page .cc-orb-teal{width:170px; height:170px; background:rgba(120,220,210,0.2); bottom:10%; left:18%; animation-duration:15s; animation-delay:2.4s;}
@keyframes cc-orb-float{
  0%,100%{ transform:translate(0,0) scale(1); }
  50%{ transform:translate(24px,-20px) scale(1.08); }
}
@media (prefers-reduced-motion: reduce){
  .calendario-camino-page .cc-tone-layer, .calendario-camino-page .cc-orb{animation:none !important;}
}

.calendario-camino-page .cc-hero{
  position:relative; width:100%; flex-shrink:0; z-index:1;
  padding:clamp(22px,4.4vh,34px) 0 0;
}
.calendario-camino-page .cc-hero-inner{
  position:relative; z-index:2; max-width:1080px; width:100%; margin:0 auto;
  padding:0 clamp(18px,4vw,40px);
}
.calendario-camino-page .cc-hero-header{justify-content:center; text-align:center;}
.calendario-camino-page .cc-hero-mascot{
  position:relative; z-index:2; margin:32px auto -54px;
  width:clamp(240px,32vw,360px); height:clamp(240px,32vw,360px);
  background-image:url('https://hdwzhwuhlrtrmhnecypm.supabase.co/storage/v1/object/public/banners/camino/camino-calendario-banner.webp');
  background-size:contain; background-repeat:no-repeat; background-position:center;
  filter:drop-shadow(0 16px 26px rgba(0,0,0,0.5)) drop-shadow(0 0 40px rgba(212,175,55,0.35));
  -webkit-mask-image:radial-gradient(closest-side, #000 86%, transparent 100%);
  mask-image:radial-gradient(closest-side, #000 86%, transparent 100%);
}
.calendario-camino-page .cc-wrap-with-mascot{padding-top:70px;}
@media (max-width:600px){
  .calendario-camino-page .cc-hero-mascot{width:clamp(160px,52vw,240px); height:clamp(160px,52vw,240px); margin-top:22px; margin-bottom:-40px;}
  .calendario-camino-page .cc-wrap-with-mascot{padding-top:56px;}
}

.calendario-camino-page .wrap{max-width:1080px; width:100%; margin:0 auto; padding:clamp(18px,3vh,30px) clamp(18px,4vw,40px) 80px; position:relative; z-index:1;}

.calendario-camino-page .header-row{display:flex; align-items:center; gap:14px; margin-bottom:6px;}
.calendario-camino-page .header-icon{
  width:clamp(42px,6vh,54px); height:clamp(42px,6vh,54px); flex-shrink:0;
  border-radius:50%; border:2px solid var(--gold);
  background:radial-gradient(circle at 35% 30%, rgba(255,229,102,0.35), rgba(212,175,55,0.12) 65%, transparent 100%);
  box-shadow:0 0 16px var(--gold-glow); display:flex; align-items:center; justify-content:center; font-size:clamp(18px,2.4vh,22px);
}
.calendario-camino-page .eyebrow-tag{font-family:'Cinzel',serif; font-weight:900; font-size:12.5px; letter-spacing:2.2px; color:var(--gold);}
.calendario-camino-page h1.page-title{font-family:'Cinzel Decorative',serif; font-weight:900; font-size:clamp(24px,3.6vh,36px); color:#fff; text-shadow:0 0 20px rgba(212,175,55,0.3); line-height:1.15;}
.calendario-camino-page .cc-story{
  display:flex; flex-direction:column; align-items:center; text-align:center;
  max-width:640px; margin:36px auto 0; gap:12px;
}
.calendario-camino-page .cc-story-ornament{
  color:var(--gold); font-size:14px; letter-spacing:8px;
  text-shadow:0 0 12px var(--gold-glow);
}
.calendario-camino-page .page-sub{
  font-family:'Crimson Text',serif; font-style:italic; font-size:clamp(16px,2.1vh,19px);
  color:rgba(255,255,255,0.88); line-height:1.65;
}
@media (max-width:600px){ .calendario-camino-page .cc-story{margin-top:26px;} }

.calendario-camino-page .progress-strip{
  margin-top:22px; display:flex; align-items:center; gap:16px; flex-wrap:wrap;
  background:var(--dark-surface); border:1px solid var(--gold-dim); border-radius:14px;
  padding:14px 20px;
}
.calendario-camino-page .progress-strip b{color:var(--gold-bright);}
.calendario-camino-page .progress-strip .txt{font-family:'Nunito',sans-serif; font-size:13.5px; color:var(--lilac); flex:1; min-width:200px;}
.calendario-camino-page .milestone-pill{
  font-family:'Cinzel',serif; font-weight:900; font-size:11.5px; letter-spacing:0.5px; color:#1a0a2e;
  background:linear-gradient(90deg,var(--gold),var(--gold-bright)); padding:6px 14px; border-radius:100px; white-space:nowrap;
}

.calendario-camino-page .week-block{margin-top:44px;}
.calendario-camino-page .week-head{display:flex; align-items:center; gap:14px; margin-bottom:22px; flex-wrap:wrap;}
.calendario-camino-page .week-medal{
  width:46px; height:46px; flex-shrink:0; border-radius:50%; border:2px solid var(--gold);
  background:radial-gradient(circle at 35% 30%, rgba(255,229,102,0.32), rgba(212,175,55,0.1) 65%, transparent 100%);
  box-shadow:0 0 14px var(--gold-glow);
  display:flex; align-items:center; justify-content:center; font-size:20px;
}
.calendario-camino-page .week-title{font-family:'Cinzel',serif; font-weight:900; font-size:clamp(16px,2.2vh,19px); color:#fff;}
.calendario-camino-page .week-phase-row{display:flex; align-items:center; gap:10px; margin-top:4px; flex-wrap:wrap;}
.calendario-camino-page .week-phase{
  font-family:'Cinzel',serif; font-weight:700; font-size:11px; letter-spacing:0.8px; color:var(--purple);
  background:rgba(204,68,255,0.12); border:1px solid rgba(204,68,255,0.3); padding:4px 11px; border-radius:100px;
}
.calendario-camino-page .week-range{font-family:'Nunito',sans-serif; font-size:13px; color:var(--lilac-dim);}

.calendario-camino-page .cc-timeline{position:relative; margin-top:6px;}
.calendario-camino-page .cc-timeline::before{
  content:""; position:absolute; left:50%; top:6px; bottom:6px; width:2px; transform:translateX(-50%); z-index:0;
  background:repeating-linear-gradient(180deg, var(--gold-dim) 0 10px, transparent 10px 22px);
}
.calendario-camino-page .cc-timeline-row{position:relative; display:flex; margin-bottom:20px; z-index:1;}
.calendario-camino-page .cc-timeline-row.left{justify-content:flex-start;}
.calendario-camino-page .cc-timeline-row.right{justify-content:flex-end;}
.calendario-camino-page .cc-timeline-row .day-card{width:calc(50% - 32px);}
.calendario-camino-page .cc-timeline-node{
  position:absolute; left:50%; top:16px; transform:translateX(-50%); z-index:2;
  width:30px; height:30px; border-radius:50%;
  background:radial-gradient(circle at 35% 30%, var(--gold-bright), var(--gold) 70%);
  border:2px solid #04020e; box-shadow:0 0 12px var(--gold-glow);
  display:flex; align-items:center; justify-content:center;
  font-family:'Cinzel',serif; font-weight:900; font-size:11px; color:#1a0a2e;
}
.calendario-camino-page .cc-timeline-row:nth-child(even) .day-card{border-color:var(--purple-glow);}
.calendario-camino-page .cc-timeline-row:nth-child(even) .day-card::before{background:radial-gradient(ellipse 70% 50% at 0% 0%, rgba(204,68,255,0.12), transparent 70%);}
@media (max-width:820px){
  .calendario-camino-page .cc-timeline::before{left:15px;}
  .calendario-camino-page .cc-timeline-row.left, .calendario-camino-page .cc-timeline-row.right{justify-content:flex-start; padding-left:44px;}
  .calendario-camino-page .cc-timeline-node{left:15px;}
  .calendario-camino-page .cc-timeline-row .day-card{width:100%;}
}

.calendario-camino-page .day-card{
  background:rgba(8,4,26,0.96); border:1px solid var(--gold-dim); border-radius:14px;
  padding:16px 18px; display:flex; flex-direction:column; gap:8px; position:relative; overflow:hidden;
}
.calendario-camino-page .day-card::before{content:""; position:absolute; inset:0; background:radial-gradient(ellipse 70% 50% at 100% 0%, rgba(212,175,55,0.08), transparent 70%); pointer-events:none;}
.calendario-camino-page .day-top{display:flex; align-items:center; justify-content:space-between; gap:10px;}
.calendario-camino-page .day-label{font-family:'Cinzel',serif; font-weight:900; font-size:12px; letter-spacing:0.4px; color:var(--lilac-dim);}
.calendario-camino-page .format-badge{
  font-family:'Cinzel',serif; font-weight:900; font-size:10.5px; letter-spacing:0.6px;
  padding:4px 10px; border-radius:100px; white-space:nowrap; display:flex; align-items:center; gap:5px;
}
.calendario-camino-page .format-badge.reel{color:#1a0a2e; background:linear-gradient(90deg,var(--gold),var(--gold-bright));}
.calendario-camino-page .format-badge.carrusel{color:#fff; background:rgba(204,68,255,0.25); border:1px solid var(--purple-glow);}
.calendario-camino-page .day-format{font-family:'Cinzel',serif; font-weight:900; font-size:16.5px; letter-spacing:0.3px; color:var(--gold-bright); text-shadow:0 1px 8px rgba(0,0,0,0.4);}
.calendario-camino-page .day-desc{font-family:'Crimson Text',serif; font-weight:500; font-size:14.5px; line-height:1.55; color:rgba(255,255,255,0.94); text-shadow:0 1px 6px rgba(0,0,0,0.35);}
.calendario-camino-page .day-video{
  margin-top:4px; display:flex; align-items:center; gap:8px;
  font-family:'Nunito',sans-serif; font-weight:700; font-size:12px; color:var(--gold-bright);
  border:1px dashed var(--gold-dim); border-radius:9px; padding:9px 12px;
}
.calendario-camino-page .day-video.pending{color:var(--lilac-dim); border-style:dashed;}
.calendario-camino-page .day-thumb{
  margin-top:6px; border-radius:10px; overflow:hidden; position:relative;
  aspect-ratio:16/10; background:linear-gradient(160deg, rgba(212,175,55,0.12), rgba(124,58,237,0.1));
  border:1px solid var(--gold-dim); display:flex; align-items:center; justify-content:center;
}
.calendario-camino-page .day-thumb.pending{background:repeating-linear-gradient(135deg, rgba(255,255,255,0.02) 0 10px, rgba(255,255,255,0.04) 10px 20px);}
.calendario-camino-page .play-btn{
  width:44px; height:44px; border-radius:50%; background:rgba(4,2,14,0.55); border:1.5px solid rgba(255,255,255,0.35);
  display:flex; align-items:center; justify-content:center; backdrop-filter:blur(2px);
}
.calendario-camino-page .play-btn svg{width:16px; height:16px; margin-left:2px;}
.calendario-camino-page .thumb-pending-label{
  position:absolute; bottom:8px; left:8px; right:8px;
  font-family:'Nunito',sans-serif; font-weight:700; font-size:10.5px; color:var(--lilac-dim);
  display:flex; align-items:center; gap:5px;
}
.calendario-camino-page .tutorial-btn{
  margin-top:2px; width:100%; display:flex; align-items:center; justify-content:space-between; gap:8px;
  font-family:'Cinzel',serif; font-weight:900; font-size:11.5px; letter-spacing:0.4px; color:var(--gold-bright);
  background:rgba(212,175,55,0.08); border:1px solid var(--gold-dim); border-radius:9px; padding:9px 12px;
  cursor:pointer; transition:background .2s, opacity .2s; opacity:0.9;
}
.calendario-camino-page .tutorial-btn:hover{opacity:1; background:rgba(212,175,55,0.14);}
.calendario-camino-page .idea-btn{
  margin-top:2px; width:100%; display:flex; align-items:center; justify-content:space-between; gap:8px;
  font-family:'Cinzel',serif; font-weight:900; font-size:11.5px; letter-spacing:0.4px; color:var(--purple);
  background:rgba(204,68,255,0.08); border:1px solid var(--purple-glow); border-radius:9px; padding:9px 12px;
  cursor:pointer; transition:background .2s, opacity .2s; opacity:0.9;
}
.calendario-camino-page .idea-btn:hover{opacity:1; background:rgba(204,68,255,0.14);}
.calendario-camino-page .idea-chevron{transition:transform .2s ease;}
.calendario-camino-page .idea-chevron.open{transform:rotate(180deg);}
.calendario-camino-page .idea-panel{
  margin-top:2px; display:flex; flex-direction:column; gap:10px;
  background:rgba(4,2,14,0.55); border:1px solid rgba(204,68,255,0.22); border-radius:10px; padding:14px 16px;
}
.calendario-camino-page .idea-block + .idea-block{border-top:1px dashed rgba(255,255,255,0.08); padding-top:10px;}
.calendario-camino-page .idea-label{
  font-family:'Cinzel',serif; font-weight:900; font-size:10.5px; letter-spacing:0.8px; color:var(--gold-bright);
  text-transform:uppercase; margin-bottom:4px;
}
.calendario-camino-page .idea-text{
  font-family:'Crimson Text',serif; font-size:13.5px; line-height:1.6; color:rgba(255,255,255,0.88); margin:0;
}

.calendario-camino-page .locked-week{
  background:rgba(255,255,255,0.02); border:1px dashed var(--gold-dim); border-radius:14px;
  padding:20px 22px; display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap;
}
.calendario-camino-page .locked-left{display:flex; align-items:center; gap:12px;}
.calendario-camino-page .locked-icon{font-size:22px;}
.calendario-camino-page .locked-txt b{color:#fff; font-family:'Cinzel',serif; font-size:14px; display:block; margin-bottom:3px;}
.calendario-camino-page .locked-txt span{font-family:'Nunito',sans-serif; font-size:12.5px; color:var(--lilac-dim);}
.calendario-camino-page .locked-cta{font-family:'Cinzel',serif; font-weight:900; font-size:11.5px; letter-spacing:0.5px; color:var(--gold-bright); white-space:nowrap;}

.calendario-camino-page .footer-note{
  margin-top:40px; padding-top:22px; border-top:1px solid rgba(212,175,55,0.15);
  font-family:'Nunito',sans-serif; font-size:13px; color:var(--lilac-dim); text-align:center; line-height:1.6;
}
`;