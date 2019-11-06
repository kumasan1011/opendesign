if (!Detector.webgl) Detector.addGetWebGLMessage();

var container, stats;

var camera, cameraTarget, scene, renderer;

var sock = new WebSocket('ws://kumasan.site:30000');
// var sock = new WebSocket('ws://echo.websocket.org');

var b_light;  // on or off
var lights_data = [];
var cloud_light, leds_sphere;
const LEDNUM = 4;
var randomColor = "#";

var leds = [];
var leds_pos = [];
leds_pos[0] = [-0.45, -0.1, 0.1];
leds_pos[1] = [-0.2, 0.1, 0.1];
leds_pos[2] = [-0.15, -0.14, 0.1];
leds_pos[3] = [0.37, -0.13, 0.1];

sock.onopen = function(e) {
    console.log('Socket接続完了');
    var send_val = {
        state : false,
        color : randomColor
    }
    send_val = JSON.stringify(send_val);
    sock.send(send_val); 
}
sock.onmessage = function(e) {
  r_lightsdata(e.data);
}
sock.onerror = function(e) {
  console.log("error");
}

function r_lightsdata(data) {
    function isValidJson(value) {
        try {
          JSON.parse(value)
        } catch (e) {
          return false
        }
        return true
    }

    if(isValidJson(data)) {
        json = JSON.parse(data);
        if(json['type']) {
            if(json['type'] == 'Group') {
                lights_data = json['clients'];
                if(lights_data.length > LEDNUM) {
                    lights_data.length = 4;
                }
                leds_sphere = new THREE.SphereBufferGeometry( 0.005, 16, 8 );
                for(var i = 0; i < lights_data.length; ++i) {
                    var c = lights_data[i]['color'];
                    console.log(c);
                    leds[i] = new THREE.PointLight( c, 2, 0.15 );
                    leds[i].add( new THREE.Mesh( leds_sphere, new THREE.MeshBasicMaterial( { color: c } ) ) );
                    scene.add(leds[i]);
                    leds[i].position.set(leds_pos[i][0], leds_pos[i][1], leds_pos[i][2]);

                    if(!lights_data[i]['state']) {
                        leds[i].visible = false;
                    }else{
                    }
                }
            }
        }else{
            var is_new = true;
            for(var i = 0; i < lights_data.length; i++) {
                if(json['id'] == lights_data[i]['id']) {
                    is_new = false;
                    lights_data[i]['state'] = json['state'];
                    if(json['state'] == true) {
                        leds[i].visible = true;
                    }else{
                        leds[i].visible = false;
                    }
                }
            }
            if(is_new && lights_data.length < LEDNUM - 1) {
                lights_data.push(json);
                var index = lights_data.length - 1;
                var c = lights_data[index]['color'];
                leds[index] = new THREE.PointLight( c, 2, 0.15 );
                leds[index].add( new THREE.Mesh( leds_sphere, new THREE.MeshBasicMaterial( { color: c } ) ) );
                scene.add(leds[index]);
                leds[index].position.z = 0.1;
                leds[index].position.set(leds_pos[index][0], leds_pos[index][1], leds_pos[index][2]);
                if(!lights_data[i]['state']) {
                    leds[index].visible = false;
                }else{
                }
            }
            
        }
    }else{
    }
}

init();
animate();

function init() {

    container = document.createElement( 'div' );
    document.body.appendChild( container );

    camera = new THREE.PerspectiveCamera( 35, window.innerWidth / window.innerHeight, 1, 15 );
    // camera.position.set(3, 0, 0  );
    camera.position.set( 0, 0.18, 2.5 );


    cameraTarget = new THREE.Vector3( 0, 0, 0 );

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x72645b );
    scene.fog = new THREE.Fog( 0x72645b, 2, 15 );

    // cloud object

    var loader = new THREE.STLLoader();
    loader.load( 'data/666.stl', function ( geometry ) {

        var cloud_mat = new THREE.MeshPhongMaterial( {
            color: 0xeeeeff,
            transparent: true,
            opacity: 0.5,
            specular: 0x040404,
            shininess: 10,
            visible: true
        } );

        var cloud_visible = new THREE.Mesh( geometry, cloud_mat );

        cloud_visible.position.set( -0.3, -0.05, 0 );
        cloud_visible.scale.set( 0.003, 0.003, 0.003 );

        cloud_visible.castShadow = true;
        cloud_visible.receiveShadow = true;
        // cloud_visible.visible = false;

        scene.add( cloud_visible );

    } );

    // rope
    var rope_mesh = new THREE.Mesh(
        new THREE.CylinderGeometry( 0.003, 0.003, 0.35, 32 ), 
        new THREE.MeshPhongMaterial( { color: 0xffffff, specular: 0x101010 } )
    );
    rope_mesh.position.y = -0.4;
    rope_mesh.position.x = 0.25;


    rope_mesh.receiveShadow = true;
    rope_mesh.castShadow = true;
    // rope_mesh.rotation.z = -Math.PI/2;

    scene.add( rope_mesh );

    var rope_mesh = new THREE.Mesh(
        new THREE.CylinderGeometry( 0.007, 0.007, 0.03, 32 ), 
        new THREE.MeshPhongMaterial( { color: 0xffffff, specular: 0x101010 } )
    );
    rope_mesh.position.y = -0.56;
    rope_mesh.position.x = 0.25;


    rope_mesh.receiveShadow = true;
    rope_mesh.castShadow = true;
    // rope_mesh.rotation.z = -Math.PI/2;

    scene.add( rope_mesh );

    // wall
    const wall_c = "0x" + Math.floor(Math.random() * 16777215).toString(16);
    var wall_mat = new THREE.MeshPhongMaterial({
        color: Number(wall_c),
        specular: 0x101010
    });
    var wall_geom = new THREE.PlaneBufferGeometry( 3, 3 );
    var textureLoader = new THREE.TextureLoader();
    var texture = textureLoader.load('data/wall_tex.jpg');
    wall_mat.map = texture;
    wall_mat.map.wrapS = THREE.RepeatWrapping;
    wall_mat.map.wrapT = THREE.RepeatWrapping;
    wall_mat.map.repeat.set(2, 2);			
    var bump = textureLoader.load('data/wall_tex_bump.jpg');
    wall_mat.bumpMap = bump;
    wall_mat.bumpScale = 0.01;
    wall_mat.bumpMap.wrapS = THREE.RepeatWrapping;
    wall_mat.bumpMap.wrapT = THREE.RepeatWrapping;


    var wall = new THREE.Mesh(wall_geom, wall_mat);
    wall.position.z = -0.05;
    scene.add( wall );

    wall.receiveShadow = true;
    

    // Lights
    scene.add( new THREE.AmbientLight(0xFFFFFF, 0.2) );
    // scene.add( new THREE.HemisphereLight( 0x111111, 0x111111 ) );

    addShadowedLight( 1, 1, 1, 0xffffee, 0.2 );
    // addShadowedLight( -1, 1, 1, 0xffffee, 0.2 );

    // leds
    leds_sphere = new THREE.SphereBufferGeometry( 0.005, 16, 8 );
    for(var i  =0; i < 6; i++) {
        randomColor += "0123456789abcdef"[16 * Math.random() | 0]
    }

    cloud_light = new THREE.PointLight( randomColor,4.5, 3 );
    cloud_light.add( new THREE.Mesh( leds_sphere, new THREE.MeshBasicMaterial( { color: 0xff0000 } ) ) );
    scene.add( cloud_light );
    cloud_light.visible = false;

    // for(var i = 0; i < LEDNUM; i++) {
    //     leds[i] = new THREE.PointLight( 0xffffff, 2, 0.15 );
    //     leds[i].add( new THREE.Mesh( leds_sphere, new THREE.MeshBasicMaterial( { color: 0xffffff } ) ) );
    //     // leds[i].position.z = 0.1;
    //     // leds[i].visible = false;
    //     // scene.add(leds[i]);
    // }
    // leds[7].position.set(0.1, 0.1, 0.1);
    // leds[8].position.set(0.1, 0.1, 0.1);
    // leds[9].position.set(0.1, 0.1, 0.1);
    // leds[10].position.set(0.1, 0.1, 0.1);
    // leds[11].position.set(0.36, -0.15, 0.1);




    // leds[0] = new THREE.PointLight( 0xffffff, 2, 0.15 );
    // leds[0].add( new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { color: 0xffffff } ) ) );
    // leds[1] = new THREE.PointLight( 0x0000ff, 2, 0.15 );
    // leds[1].add( new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { color: 0x0000ff } ) ) );
    // leds[0].position.z = 0.1;
    // leds[1].position.z = 0.1;
    // leds[1].position.x = 0.2;

    // scene.add( leds[0] );
    // scene.add( leds[1] );


    // renderer

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );

    renderer.gammaInput = true;
    renderer.gammaOutput = true;

    renderer.shadowMap.enabled = true;

    container.appendChild( renderer.domElement );

    // stats

    stats = new Stats();
    container.appendChild( stats.dom );

    //

    b_light = false;

    window.addEventListener( 'resize', onWindowResize, false );
    container.addEventListener( 'mousedown', onDocumentMouseDown, false );
    window.addEventListener('beforeunload', function(e) {
        e.preventDefault();
        sock.close();
    }, false);


}

function addShadowedLight( x, y, z, color, intensity ) {

    var directionalLight = new THREE.DirectionalLight( color, intensity );
    directionalLight.position.set( x, y, z );
    scene.add( directionalLight );

    directionalLight.castShadow = true;

    var d = 1;
    directionalLight.shadow.camera.left = -d;
    directionalLight.shadow.camera.right = d;
    directionalLight.shadow.camera.top = d;
    directionalLight.shadow.camera.bottom = -d;

    directionalLight.shadow.camera.near = 1;
    directionalLight.shadow.camera.far = 4;

    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;

    directionalLight.shadow.bias = -0.002;

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function onDocumentMouseDown( event ) {
    event.preventDefault();

    b_light = !b_light;
    var send_val = {
        state : b_light,
        color : randomColor
    }
    send_val = JSON.stringify(send_val);
    sock.send(send_val); 
    // sock.send("true");

    if(b_light) {

        cloud_light.visible = true;
       }else{
        cloud_light.visible = false;
    }
}

function animate() {

    requestAnimationFrame( animate );

    render();
    stats.update();

}

function render() {

    var timer = Date.now() * 0.0005;

    // camera.position.x = Math.cos( timer ) * 3;
    // camera.position.z = Math.sin( timer ) * 3;

    camera.lookAt( cameraTarget );

    renderer.render( scene, camera );

}