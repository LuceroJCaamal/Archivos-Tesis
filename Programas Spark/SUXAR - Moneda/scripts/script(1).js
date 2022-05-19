
//==============================================================================

import { isAbsolute } from 'path';
import { quaternionFromAngleAxis } from 'Reactive';

// Carga de modulos necesarios, incluyendo Cannon.js
const Scene = require('Scene');
const Animation = require ('Animation');
const Time = require('Time');
const CANNON = require('cannon');
var ReactiveModule = require('Reactive');
const Patches = require('Patches');
var varGlobal = true;


// Imprime los resultados en consola
export const Diagnostics = require('Diagnostics');

//Genera números aleatorios
function aleatorio(min, max) {
  return Math.floor((Math.random() * (max - min + 1)) + min);
}

//funcion para la animacion de la moneda.
function animacionMoneda(objectMoneda){
  var bandera=true;
  if(bandera==true){

    objectMoneda.transform.y=300;
    //------------------------------------
    objectMoneda.transform.rotationX= 0;

    // Función para la animación de la rotación
    function axisRotation(axis_x, axis_y, axis_z, angle_degrees) {
      var norm = Math.sqrt(axis_x * axis_x + axis_y * axis_y + axis_z * axis_z);
      axis_x /= norm;
      var angle_radians = angle_degrees * Math.PI / 180.0;
      var cos = Math.cos(angle_radians / 2);
      var sin = Math.sin(angle_radians / 2);
      return ReactiveModule.rotation(cos, axis_x * sin, 0, 0);
    }

    // Sección de determinación para la cara de la moneda
    var random = aleatorio(0,1);
    //Diagnostics.log(random);
    var vueltas = 0.0;

    if(random==0){
      vueltas = 6.5; //6.5 para hacerlo caer de sol
      Diagnostics.log("Cae sol");
    }else{
      vueltas = 6.1667; //6.1667 para hacerlo caer de aguila
      Diagnostics.log("Cae aguila");
    }

    const parameters = {
      durationMilliseconds: 500,
      loopCount: vueltas, //6.5 para hacerlo caer de sol y 6.1667 para que sea aguila.
      mirror: false //Si es true hace de ida y vuelta false es un sentido.
    };

    
    const driver = Animation.timeDriver(parameters);
    var rotation_sampler = Animation.samplers.polyline({
      keyframes: [
        // 
        axisRotation(1, 0, 0, 0),
        axisRotation(1, 0, 0, 180),
        axisRotation(1, 0, 0, 270),
        axisRotation(1, 0, 0, 360),
      ],
        knots: [0, 1, 2, 3]
    }); 
    
    // ==============================================================================
    // Animacion de la caida de la moneda
    //==============================================================================

    // Create a set of time driver parameters
    const timeDriverParameters2 = {
      // Duracion del driver
      durationMilliseconds: 4000,

      // Numero de interaciones antes de que el driver pare
      loopCount: 1,
      
      // Espejo para el giro
      mirror: false
    };

    // Creación del tiempo del driver con parametros
    const timeDriver2 = Animation.timeDriver(timeDriverParameters2);

    // Create a sampler with a quadratic change in and out from -5 to 5
    const quadraticSampler = Animation.samplers.easeInOutQuad(300, -80);

    // Creación de la animación combinada con el driver y sampler
    const translationAnimation = Animation.animate(timeDriver2, quadraticSampler);

    // Vinculación de la señal de animación de traslación a la señal de posición del eje y del plano
    //Bind the translation animation signal to the x-axis position signal of the plane
    objectMoneda.transform.y = translationAnimation;

    // Inicio del driver de tiempo
    timeDriver2.start();

    // Inicio de la animación
    var rotation_signal = Animation.animate(driver, rotation_sampler);
    driver.start();
    
    objectMoneda.transform.rotation= rotation_signal;
    
    // Creación de la función para detener la animación
    function stopIntervalTimer() {
      driver.stop();
    }

    // Llamada de la función para detener la animación 
    const timeoutTimer = Time.setTimeout(stopIntervalTimer, 4000); 
  }  

  return random;

}

(async function () {  

 // Referencia de objeto moneda de la escena.
  var objectMoneda = await Scene.root.findFirst("Moneda");
  var validarAnimacion = animacionMoneda(objectMoneda);
  var scoreIzquierda = 0;
  var scoreDerecha = 0;
  // Declare variable to keep track of this pulse
  var pulsedIzquierda;
 

  Patches.outputs.getPulse('ToScriptPulseIzquierda').then(event => {
    Diagnostics.log(validarAnimacion);
    pulsedIzquierda = event.subscribe(function () {    
      if(validarAnimacion==0){
        scoreIzquierda++;
        Patches.inputs.setString("scoreSol",scoreIzquierda.toString());
        Patches.inputs.setScalar('scoreSolNumber', scoreIzquierda);
        Diagnostics.log("Correcto");
        Patches.inputs.setBoolean('activadorIncorrecto', false);
        Diagnostics.log("--------------------------------------");
        validarAnimacion = animacionMoneda(objectMoneda); 
      }else{
        Diagnostics.log("Respuesta incorrecta");
        Patches.inputs.setBoolean('activadorIncorrecto', true);
        Diagnostics.log("--------------------------------------");
        
      }
    }); 
  });

  var pulsedDerecha;

  Patches.outputs.getPulse('ToScriptPulseDerecho').then(event => {
    Diagnostics.log(validarAnimacion);
    pulsedDerecha = event.subscribe(function () {
      if(validarAnimacion==1){
        scoreDerecha++;
        Patches.inputs.setString("scoreAguila",scoreDerecha.toString());
        Patches.inputs.setScalar('scoreAguilaNumber', scoreDerecha);
        Diagnostics.log("Correcto");
        Patches.inputs.setBoolean('activadorIncorrecto', false);
        Diagnostics.log("--------------------------------------");
        validarAnimacion = animacionMoneda(objectMoneda);        
      }else{
        Diagnostics.log("Respuesta incorrecta");
        Patches.inputs.setBoolean('activadorIncorrecto', true);
        Diagnostics.log("--------------------------------------");   
      }  
    });
  });
  
  //Diagnostics.log(activado);



       
})(); 
