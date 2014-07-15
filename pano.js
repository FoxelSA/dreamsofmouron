/**
 * Website of the Dreams of Mouron project.
 *
 * Copyright (c) 2013-2014 FOXEL SA - http://foxel.ch
 * Please read <http://foxel.ch/license> for more information.
 *
 *
 * Author(s):
 *
 *      Oleg Lavrovsky
 *
 *
 * Contributor(s):
 *
 *      Alexandre Kraft <a.kraft@foxel.ch>
 *      Luc Deschenaux <l.deschenaux@foxel.ch>
 *
 *
 * This file is part of the FOXEL project <http://foxel.ch>.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
 *
 * Additional Terms:
 *
 *      You are required to preserve legal notices and author attributions in
 *      that material or in the Appropriate Legal Notices displayed by works
 *      containing it.
 *
 *      You are required to attribute the work as explained in the "Usage and
 *      Attribution" section of <http://foxel.ch/license>.
 */

var PANO = {};
PANO.main = function() {

var camera, scene, renderer, projector, tween;

var fov = 70,
texture_placeholder,
isUserInteracting = false,
onMouseDownMouseX = 0, onMouseDownMouseY = 0,
lon = 0, onMouseDownLon = 0,
lat = 0, onMouseDownLat = 0,
phi = 0, theta = 0;

var orbs = [], sounds = [];
var soundFiles = [], soundPos = [], soundYos = [], soundTxt = [], soundSizes = [];
var currentOrb = 0, swinging = false;
var audio, mute = false;
var loading = 0;

var FLOOR_SCROLL = -0;
var FLOOR_BOTTOM = -38;
var FLOOR_FACTOR = 18;
var FLOOR_FREEZE = FLOOR_FACTOR * (FLOOR_SCROLL - FLOOR_BOTTOM);

var is_firefox = /firefox/i.test(navigator.userAgent);
var htmlbody = $('html, body');

var isWelcome = true;

var reqAnimFrame = true;
var isFirstFrame = false;

// Load configuration
PANO.sounds.forEach(function(s) {
    if (s.length < 2)
        return console.error("Invalid config", s);
    soundFiles.push(s[0]);
    soundPos.push( s.length>0 ? s[1] : null);
    soundYos.push( s.length>1 ? s[2] : 0);
    soundTxt.push( s.length>2 ? $('#'+s[3]).html() : null);
    soundSizes.push( s.length>3 ? s[4] : 10);
});
if (PANO.helper) {
    document.write('<div id="crosshair"></div>');
}

var loadingDone = soundFiles.length;

initAura();
initScene();
initOrbs();
initUI();
initWelcome();

animate(); // go!

function initAura() {
    var a = {};
    audio = a;

    // Detect if the audio context is supported.
    window.AudioContext = (
      window.AudioContext ||
      window.webkitAudioContext ||
      null
    );
    if (!AudioContext) {
      //throw new Error("AudioContext not supported!");
      loadProgress(1);
      alert("AudioContext not supported! Sound disabled !");
      var progress=setInterval(function(){
        loadProgress(1);
        if (loadingCount==loading) {
          clearInterval(progress);
        }
      },500);
      return;
    }

    a.context = new AudioContext();
    a.convolver = a.context.createConvolver();
    a.volume = a.context.createGain();

    a.mixer = a.context.createGain();

    a.flatGain = a.context.createGain();
    a.convolverGain = a.context.createGain();

    a.destination = a.mixer;
    a.mixer.connect(a.flatGain);
    //a.mixer.connect(a.convolver);
    a.convolver.connect(a.convolverGain);
    a.flatGain.connect(a.volume);
    a.convolverGain.connect(a.volume);
    a.volume.connect(a.context.destination);
}

function loadBuffer(soundFileName, callback) {
    var request = new XMLHttpRequest();
    request.open("GET", soundFileName, true);
    request.responseType = "arraybuffer";
    var ctx = audio.context;
    request.onload = function() {
      ctx.decodeAudioData(request.response, function onSuccess(decodedBuffer) {
        callback(decodedBuffer);
      }, function onFailure() {
        alert("Decoding the audio buffer failed");
      });
    };
    request.send();
    return request;
}

function loadSound(soundFileName) {
    if (!AudioContext) {
      return;
    }

    var ctx = audio.context;

    var sound = {};
    sound.source = ctx.createBufferSource();
    sound.source.loop = true;
    sound.panner = ctx.createPanner();
    sound.volume = ctx.createGain();

    sound.source.connect(sound.volume);
    sound.volume.connect(sound.panner);
    sound.panner.connect(audio.destination);

    setTimeout(function(){
        loadBuffer(soundFileName,
            function(buffer){
              sound.buffer = buffer;
              sound.source.buffer = sound.buffer;
              loadProgress(1);
            });
    }, 250);

    return sound;
}

function loadPlainSound(soundFileName, soundVolume) {
    if (!AudioContext) {
      return {};
    }

    var ctx = audio.context;

    var sound = {};
    sound.source = ctx.createBufferSource();
    sound.source.loop = true;
    sound.volume = ctx.createGain();
    if (typeof soundVolume !== 'undefined')
        sound.volume.gain.value = soundVolume;

    sound.source.connect(sound.volume);
    sound.volume.connect(audio.destination);

    setTimeout(function(){
        loadBuffer(soundFileName,
            function(buffer){
              sound.buffer = buffer;
              sound.source.buffer = sound.buffer;
              sound.source.start(audio.context.currentTime);
            });
    }, 250);

    return sound;
}

function loadProgress(dir) {
    loading += dir;
    var pc = parseInt(100 * (loading+1) / loadingDone) + '%';
    $('#pc').css('width', pc);
    $('#pctx').html('Loading ' + pc + '<span style="position:relative;top:-25px;display:block;font-size:12px;">Please use the latest version of Chromium, Google Chrome or Firefox.</span>');
}

function setPosition(object, soundObject, x, y, z) {

    var p = new THREE.Vector3()
            .getPositionFromMatrix(object.matrixWorld);

    var px = p.x, py = p.y, pz = p.z;
    object.position.set(x,y,z);
    object.updateMatrixWorld();

    var q = new THREE.Vector3()
            .getPositionFromMatrix(object.matrixWorld);

    var dx = q.x-px, dy = q.y-py, dz = q.z-pz;

    if (AudioContext) {
      soundObject.setPosition(q.x, q.y, q.z);
    }

}

function setOrientation(object, soundObject, x, y, z) {

    var m = object.matrixWorld;
    var mx = m.n14, my = m.n24, mz = m.n34;
    m.n14 = m.n24 = m.n34 = 0;

    var vec = new THREE.Vector3(0,0,1);
    vec.applyMatrix3(m);
    vec.normalize();

    if (AudioContext) {
      soundObject.setOrientation(vec.x, vec.y, vec.z);
    }

    m.n14 = mx;
    m.n24 = my;
    m.n34 = mz;
}

function setListenerPosition(object, x, y, z) {

    setPosition(object, AudioContext?audio.context.listener:null , x, y, z);

    var m = object.matrix;
    var mx = m.n14, my = m.n24, mz = m.n34;
    m.n14 = m.n24 = m.n34 = 0;

    var vec = new THREE.Vector3(0,0,1);
    vec.applyMatrix3(m);
    //m.multiplyVector3(vec);
    vec.normalize();

    var up = new THREE.Vector3(0,-1,0);
    up.applyMatrix3(m);
    //m.multiplyVector3(up);
    up.normalize();

    if (AudioContext) {
      audio.context.listener.setOrientation(vec.x, vec.y, vec.z, up.x, up.y, up.z);
    }

    m.n14 = mx;
    m.n24 = my;
    m.n34 = mz;
}

function initScene() {

    var container, mesh;

    container = $('#container')[0];

    camera = new THREE.PerspectiveCamera( fov, window.innerWidth / window.innerHeight, 1, 1100 );
    camera.target = new THREE.Vector3( 0, 0, 0 );

    scene = new THREE.Scene();

    projector = new THREE.Projector();

    var geometry = new THREE.SphereGeometry( 500, 60, 40 );
    geometry.applyMatrix( new THREE.Matrix4().makeScale( -1, 1, 1 ) );

    var material = new THREE.MeshBasicMaterial( {
        map: THREE.ImageUtils.loadTexture( PANO.panorama )
    } );

    mesh = new THREE.Mesh( geometry, material );
    mesh.name = "Panorama";
    scene.add( mesh );

    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    container.appendChild( renderer.domElement );

    document.addEventListener( 'mousedown', onDocumentMouseDown, false );
    document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    document.addEventListener( 'mouseup', onDocumentMouseUp, false );
    document.addEventListener( 'mousewheel', onDocumentMouseWheel, false );
    document.addEventListener( 'DOMMouseScroll', onDocumentMouseWheel, false);

    window.addEventListener( 'resize', onWindowResize, false );
} // -initScene

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
    render();
}

function onDocumentMouseDown( event ) {
    //if (!scrollIsTop()) return;

    event.preventDefault();
    isUserInteracting = true;

    if (PANO.swinging) { tween.stop(); PANO.swinging = false; }

    onPointerDownPointerX = event.clientX;
    onPointerDownPointerY = event.clientY;

    onPointerDownLon = lon;
    onPointerDownLat = lat;

    var vector = new THREE.Vector3( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1, 0.5 );
    projector.unprojectVector( vector, camera );

    var raycaster = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );
    var intersects = raycaster.intersectObjects( scene.children );

    if ( intersects.length > 1 ) {
        var ix = intersects[0].object.index;
        if (soundTxt[ix]) PANO.popup(soundTxt[ix],'paint'+(ix+1));
        swingTo(ix+1);
    } else {
        setRequestAnimationFrame(true);
    }
}

function onDocumentMouseMove( event ) {
    if (isUserInteracting && !PANO.swinging) {
        lon = ( onPointerDownPointerX - event.clientX ) * 0.1 + onPointerDownLon;
        lat = ( event.clientY - onPointerDownPointerY ) * 0.1 + onPointerDownLat;
        if (lat < FLOOR_BOTTOM) { lat = FLOOR_BOTTOM; return; }
        scrollPageWithLat();
    }
}

function onDocumentMouseUp( event ) {
    if (!PANO.swinging)
        setRequestAnimationFrame(false);
    isUserInteracting = false;
    scrollIsTop();
}

function onDocumentMouseWheel( event ) {

    if (htmlbody.scrollTop() > 0) {
        return;
    } else {
        event.preventDefault();
    }

    // WebKit
    if ( event.wheelDeltaY ) {
        fov -= event.wheelDeltaY * 0.05;

    // Opera / Explorer 9
    } else if ( event.wheelDelta ) {
        fov -= event.wheelDelta * 0.05;

    // Firefox
    } else if ( event.detail ) {
        fov += event.detail * 1.0;
    }

    // Set bounds for zooming
    fov = Math.min(Math.max(fov, 20), 70);

    camera.projectionMatrix.makePerspective( fov, window.innerWidth / window.innerHeight, 1, 1100 );
    render();
}

function animate() {

    if (reqAnimFrame)
        requestAnimationFrame(animate);

    if (loading < loadingDone) { return; }
    else if (loading == loadingDone) { // run once

        isFirstFrame = true;

        $('#loading').hide();
        $('#controls').removeClass('hide');
        if (AudioContext) {
          var ctx = audio.context;
          orbs.forEach(function(c) {
              c.sound.source.start(ctx.currentTime + 0.020);
          });
        }
        loading++;
    }

    TWEEN.update();
    updateAura();
    render();

    if (isFirstFrame) {
        isFirstFrame = false;
        setRequestAnimationFrame(false);
    }
}

function setRequestAnimationFrame(state) {
    reqAnimFrame = state;
    if (reqAnimFrame)
        requestAnimationFrame(animate);
}

function render() {

    lat = Math.max( - 85, Math.min( 85, lat ) );
    phi = THREE.Math.degToRad( 90 - lat );
    theta = THREE.Math.degToRad( lon );

    camera.target.x = 500 * Math.sin( phi ) * Math.cos( theta );
    camera.target.y = 500 * Math.cos( phi );
    camera.target.z = 500 * Math.sin( phi ) * Math.sin( theta );

    camera.lookAt( camera.target );

    /*
    // distortion
    camera.position.x = - camera.target.x;
    camera.position.y = - camera.target.y;
    camera.position.z = - camera.target.z;
    */

    renderer.render( scene, camera );

}

function initOrbs() {

    var signs = [];

    var resolution = soundFiles.length;
    var amplitude = 20;
    var size = 360 / resolution;

    for (var i = 0; i < resolution; i++) {

        var segment = ( i*size ) * Math.PI/180;
        if (soundPos.length > i) {
            segment = soundPos[i] * Math.PI/180;
        }
        //console.log(i, segment * 180 / Math.PI);

        var X = Math.cos( segment ) * amplitude;
        var Z = Math.sin( segment ) * amplitude;
        var Y = soundYos[i];

        var cube = new THREE.Mesh(
                new THREE.CubeGeometry( 1, 1, 1 ),
                new THREE.MeshBasicMaterial( { color: 0xff0000 } )
            );
        cube.visible = false;
        cube.sound = loadSound('sound/' + soundFiles[i]);
        cube.soundFile = soundFiles[i].replace('.mp3', '');
        cube.name = "Soundcube " + i;
        scene.add( cube );
        orbs.push(cube);

        var sign = new THREE.Mesh(
                new THREE.SphereGeometry( soundSizes[i], 10, 10 ),
                new THREE.MeshBasicMaterial( { color: 0x0000ff, transparent: true, opacity: 0.4 } )
            );
        sign.name = "Orb " + cube.soundFile;
        sign.index = i;
        sign.visible = PANO.helper;
        sign.position.set(X, Y, Z);
        cube.origin = sign.position;
        cube.orient = segment;
        cube.orientdeg = segment * 180/Math.PI;

        scene.add( sign );
        signs.push(sign);
    }

} // -initOrbs

function updateAura() {

    var cp = camera.position;
    var camZ = cp.z, camX = cp.x, camY = cp.y;
    setListenerPosition(camera, camX, camY, camZ);

    var cx = camX, cy = camY, cz = camZ;

    // Move sound source slightly in Firefox
    cx += (is_firefox) ? 0.5 : 0;

    var cl = orbs.length;

    var degabs = (theta * 180/Math.PI) % 360;
    degabs = (degabs < 0) ? 360 + degabs : degabs;

    var maxdist = 0.2 * 360/cl;

    // Oscillating function
    orbs.forEach(function(c, i) {
        var dist = Math.abs(c.orientdeg - degabs);
        if (i == 0 && degabs > 180)
            dist = Math.abs(360 - degabs);

        // Fade distant orbs
        if (dist > maxdist * 10) {
            setPosition(c, c.sound?c.sound.panner:null , 11111, 0, 0);
        } else {
            var offset = Math.pow(( theta - c.orient )*5,3);
            setPosition(c, c.sound?c.sound.panner:null, cx, cy, cz + offset);
        }

        if (dist <= maxdist) {
            // Determine central orb
            if (!PANO.swinging) currentOrb = i + 1;

            // For debugging
            if (PANO.helper) {
                document.title = currentOrb + " " + c.soundFile + " ~" + parseInt(degabs);
            }
        }
    });

} // -updateAura

function swingTo(a) {

    var to = soundPos[a-1];

    // Wrap around
    if (a == 1 && lon >= soundPos[parseInt(soundPos.length/2)]) to += 360;
    if (a > soundPos.length/2 && lon <= soundPos[0]) to -= 360;

    PANO.swinging = true;

    setRequestAnimationFrame(true);

    // Start animation
    tween = new TWEEN.Tween({ lon: lon })
        .easing( TWEEN.Easing.Cubic.Out )
        .onUpdate(function () { lon = this.lon; })
        .onComplete(function() {

            setRequestAnimationFrame(false);

            PANO.swinging = false;
            if (lon < 0) lon += 360;
            if (lon > 360) lon -= 360;
        })
        .to({ lon: to }, 2000 ).start();

} // -swingTo

function initWelcome() {

    if (typeof PANO.bgsound !== 'undefined')
        loadPlainSound('sound/' + PANO.bgsound[0], PANO.bgsound[1]);

    if (typeof PANO.welcome !== 'undefined') {
        PANO.popup($('#'+PANO.welcome).html(),'welcome');
    }

}

function scrollPageWithLat() {
    if (lat < FLOOR_SCROLL) {
        htmlbody.scrollTop(FLOOR_FACTOR * (FLOOR_SCROLL - lat));
    } else {
        htmlbody.scrollTop(0);
    }
}

function scrollIsTop() {
    if (lat < FLOOR_SCROLL || htmlbody.scrollTop() > 0) {
        //$('body').css('overflow-y', 'scroll');
        $('body').css('overflow-y', 'hidden');
        //$('#controls').css('margin-left', '7px');
        $('#controls').css('margin-left', '0');
        $('#down').html('&#8673;'); // up arrow
        return false;
    } else {
        $('body').css('overflow-y', 'hidden');
        $('#controls').css('margin-left', '0');
        $('#down').html('&#8675;'); // down arrow
        return true;
    }
}

function initUI() {

    htmlbody.scrollTop(0); // reset to top
    $('#website').css('visibility', 'visible');

    $('#next').on('mousedown', function(e) {
        if (PANO.swinging) return;
        e.stopPropagation();
        var from = currentOrb;
        currentOrb = (from>=orbs.length) ? 1 : from+1;
        swingTo(currentOrb);

    }).on('mouseup', function() { isUserInteracting = false; });

    $('#prev').on('mousedown', function(e) {
        if (PANO.swinging) return;
        e.stopPropagation();
        var from = currentOrb;
        currentOrb = (from<=1) ? orbs.length : from-1;
        swingTo(currentOrb);

    }).on('mouseup', function() { isUserInteracting = false; });

    $('#down').on('mousedown', function(e) {
        if (PANO.swinging) tween.stop();
        e.stopPropagation();

        setRequestAnimationFrame(true);

        // Create a vertical tween
        tween = new TWEEN.Tween({ lat: lat })
            .easing( TWEEN.Easing.Cubic.Out )
            .onUpdate(function() { lat = this.lat; scrollPageWithLat(); })
            .onComplete(function() { setRequestAnimationFrame(false); PANO.swinging = false; scrollIsTop(); });

        // Pan camera down or up
        PANO.swinging = true;
        var tgtlat = (lat >= FLOOR_SCROLL) ? FLOOR_BOTTOM : 0;
        tween.to({ lat: tgtlat }, 1000 ).start();

        //htmlbody.scrollTop(10000);

    // -#down
    }).on('mouseup', function() { isUserInteracting = false; });

    $('.modal .close').click(function() {
        $('.modal').hide();
        window.removeEventListener( 'resize', onWindowResizeAdaptOverlay, false );

        if (isWelcome) {
            isWelcome = false;
            setTimeout(function(){$('#next').trigger('mousedown');},150);
        }
    });

    document.onkeydown = function(e) {
        if (!e) e = window.event;
        if (e.keyCode) {
            if (e.keyCode == "27") {
                $('.modal').hide();
                window.removeEventListener( 'resize', onWindowResizeAdaptOverlay, false );

                if (isWelcome) {
                    isWelcome = false;
                    setTimeout(function(){$('#next').trigger('mousedown');},150);
                }
            };
        } else if (e.charCode) {
            if (e.charCode == "27") {
                $('.modal').hide();
                window.removeEventListener( 'resize', onWindowResizeAdaptOverlay, false );

                if (isWelcome) {
                    isWelcome = false;
                    setTimeout(function(){$('#next').trigger('mousedown');},150);
                }
            };
        }
    };

} // -initUI

}; // PANO.main

var currentDialogHeight = 0;

function onWindowResizeAdaptOverlay() {
    var maskHeight = $(window).height();
    var maskWidth = $(window).width();

    var dialogTop =  (maskHeight/2) - (currentDialogHeight/2);
    var dialogLeft = (maskWidth/2) - (PANO.dialogWidth/2);

    $('#dialog-overlay').css({height:maskHeight, width:maskWidth});
    $('#dialog-box').css({top:dialogTop, left:dialogLeft});
}

PANO.popup = function(message,index) {

    currentDialogHeight = PANO.dialogHeight[index];

    // display the message
    $('#dialog-message').html(message);

    // get the screen height and width
    var maskHeight = $(window).height();
    var maskWidth = $(window).width();
    $('#dialog-box').width(PANO.dialogWidth);
    $('#dialog-box').height(currentDialogHeight);

    // calculate the values for center alignment
    var dialogTop =  (maskHeight/2) - (currentDialogHeight/2);
    var dialogLeft = (maskWidth/2) - (PANO.dialogWidth/2);

    // assign values to the overlay and dialog box
    $('#dialog-overlay').css({height:maskHeight, width:maskWidth}).show();
    $('#dialog-box').css({top:dialogTop, left:dialogLeft}).fadeIn();

    // adapt overlay
    window.addEventListener( 'resize', onWindowResizeAdaptOverlay, false );

    $('#welabout').on('click',function(event) {
        event.preventDefault();
        $('.modal .close').trigger('click');
        setTimeout(function(){$('#down').trigger('mousedown');},150);
    });

    $('#welplay').on('click',function(event) {
        event.preventDefault();
        $('.modal .close').trigger('click');
        setTimeout(function(){$('#next').trigger('mousedown');},150);
    });

}; // -PANO.popup

(function($){
  $.extend($.fn, {
    fadeIn: function(ms){
      if(typeof(ms) === 'undefined'){
        ms = 1000;
      }
      var self = this;
      $(self).css({'display':'block','opacity':0});
      new TWEEN
        .Tween({ o: 0 })
        .to({ o: 1 }, ms )
        .easing( TWEEN.Easing.Cubic.Out )
        .onUpdate(function() { $(self).css('opacity', this.o); })
        .start();

      return this;
    }
  })
})(Zepto);
