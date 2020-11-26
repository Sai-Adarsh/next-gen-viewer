import { AfterViewInit, Component, OnInit} from '@angular/core';
import XYZ from 'ol/source/XYZ';
import * as turf from '@turf/turf'
import Map from 'ol/Map';
import View from 'ol/View';
import LayerTile from 'ol/layer/Tile';
import ZoomToExtent from 'ol/control/ZoomToExtent';
import FullScreen from 'ol/control/FullScreen';
import ScaleLine from 'ol/control/ScaleLine';
import Attribution from 'ol/control/Attribution';
import SourceOsm from 'ol/source/OSM';
import SourceStamen from 'ol/source/Stamen';
import { fromLonLat, transform } from 'ol/proj';
import { defaults as defaultControls } from 'ol/control';
import { defaults as defaultInteractions, PinchZoom, Modify, Select } from 'ol/interaction';
import { Injectable } from '@angular/core';
import 'ol/ol.css';
import {Circle as CircleStyle, Fill, Stroke, Style, Text} from 'ol/style';
import Draw from 'ol/interaction/Draw';
import {OSM, Vector as VectorSource} from 'ol/source';
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer';
import GeoJSON from 'ol/format/GeoJSON';
import MousePosition from 'ol/control/MousePosition';
import {createStringXY} from 'ol/coordinate';
import SourceVector from 'ol/source/Vector';
import {FormControl} from '@angular/forms';
import {Observable} from 'rxjs';
import {map, startWith} from 'rxjs/operators';
import Zoomify from 'ol/source/Zoomify';
import {MatSnackBar} from '@angular/material/snack-bar';
import firebase from "firebase";
import Feature from 'ol/Feature';
import Polygon from 'ol/geom/Polygon';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { ReplserviceService } from './replservice.service';
import * as polygonClipping from 'polygon-clipping';
declare var $: any;

interface Tracer {
  value: string;
  viewValue: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit, OnInit  {

  constructor(private _snackBar: MatSnackBar, private httpClient: HttpClient, private replserviceService: ReplserviceService) {}
  
  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 2000,
    });
  }
  
  changeHeaderTest(message: String) {
    this.headerTest = message;
    console.log(this.headerTest);
  }

  public treeRegion = 0;
  myControl = new FormControl();
  options: string[] = ['turnOnGEOJson', 'turnOffGEOJson', 'savePolygons', 'retrievePolygons', 'loadPolygons'];
  filteredOptions: Observable<string[]>;

  ngOnInit() {
    this.filteredOptions = this.myControl.valueChanges
      .pipe(
        startWith(''),
        map(value => this._filter(value))
      );

      $( () => {
        // 6 create an instance when the DOM is ready
        function nodeExpand(node){
          if (node.children.length === 0)
            return {text:node.name,...node};
          else 
            for(var i=0;i<node.children.length;i++){
              node.children[i] = nodeExpand(node.children[i]);
            }
            return {text:node.name,...node};
        }
        $(".search-input").keyup(function () {
          var searchString = $(this).val();
          $('#atlas_info').jstree('search', searchString);
        });
      
        $.getJSON('https://raw.githubusercontent.com/Sai-Adarsh/viewer-geojson/main/h.json', (jsonresponse) => {
          var dataNode=nodeExpand(jsonresponse.msg[0]);
          $('#atlas_info')
          .on("changed.jstree",  (e, data) => {
            if(data.selected.length) {
              //alert('The selected node is: ' + data.instance.get_node(data.selected[0]).text);
              //console.log(data.selected);
              this.treeRegion = data.selected[0];
              console.log(this.treeRegion);
              console.log('The selected node is: ' + data.selected[0]);//data.instance.get_node(data.selected[0]).text);
              this.displayFeatures()
              // if(data.selected.length == 1)
              //   drawAtlasRegion(data.selected);
              // else{
              //   failMessage('<h5>Please select only one</h5>');
              //   return;
              // }
            }
          })
          .jstree({ 
            "plugins" : ["search"],
            'core' : {
              'themes': {
                'name': 'proton',
                'responsive': true,
                'icons': false,
                'variant': 'large',
                'dots': true,
              },
              'multiple': false,
              // 'check_callback': true,
              'data' :function(node,cb){
                    if(node.id === '#'){
                      cb({...dataNode},dataNode.children);
                      }
                  }
            },
            "search": {
              "case_insensitive": true,
              "show_only_matches" : true
            }});
        })
      });

  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.options.filter(option => option.toLowerCase().includes(filterValue));
  }

  public switchLayer;
  public showFiller2;
  public showFillerREPL;
  public showFiller;
  public panelOpenState;
  public disabled;
  public checked;
  public redoStack;
  public toBeRedrawn;
  public toBeDeleted;
  public zoomifyLayer;
  public extent;
  public invert;
  public invertString: number;
  public HueString: number;
  public SaturationString: number;
  public invertValue: string;
  public firebaseConfig;
  public loadedVector;
  public defaultURL;
  public loadedFeature; //load, save
  public loadedCoords; //load, save
  public defaultGeoJSONSecNo;
  public lastChecked;
  public treeString;
  public urlData;
  public secNo;
  public brainID;
  public PMDID;
  public lastRegionID = -1;
  public featureStack = [];
  public lastol_uid=0;
  public last_size = 0;
  /** OL-Map. */
  map: Map;
  /** Basic layer. */
  layerTile: LayerTile;
  /** Sources for basic layer. */
  sources: { readonly osm: SourceOsm; readonly stamen: SourceStamen; readonly vector: VectorSource;};
  mousePositionControl: MousePosition;
  vector: VectorLayer;
  vectorLayerTile: LayerTile;
  modifyVector: VectorLayer;
  select: Select;
  modify: Modify;
  public  draw: Draw;
  delVector: VectorSource;
  vectorSource: VectorSource;
  zoomifySource: Zoomify;
  imagery: TileLayer;
  public styleAdd : Style;
  public styleErase : Style;
  public addPolygon : Draw;
  public erasePolygon : Draw;
  public headerTest: String = "Home";
  public selectedValue: string = 'nissl';
  public selectedCar: string;
  public individualRegion;

  tracers: Tracer[] = [
    {value: 'fluro', viewValue: 'Fluro'},
    {value: 'nissl', viewValue: 'Nissl'}
  ];

  //json format
  public saveJson = {
    "firstpassAtlas":{},
    "userActions":[],
    "outputCombine":{}
  };


  /**
   * Initialise the map.
   */

  ngAfterViewInit() {
    this.firebaseConfig = {
      apiKey: "AIzaSyA_rPzl1D8YouEsSJ1AjQwElFqH_mxOAFI",
      authDomain: "realtime-4a7de.firebaseapp.com",
      databaseURL: "https://realtime-4a7de.firebaseio.com",
      projectId: "realtime-4a7de",
      storageBucket: "realtime-4a7de.appspot.com",
      messagingSenderId: "624733681109",
      appId: "1:624733681109:web:ab5c7b2277fbf1ffd6b95c",
      measurementId: "G-W109P6TCZL"
    };

    
    if (!firebase.apps.length) {
        firebase.initializeApp(this.firebaseConfig);
    }

    this.defaultGeoJSONSecNo = 60;
    this.secNo = 60;
    this.brainID = 4958
    this.PMDID = 'PMD2495';

    this.sources = {
      osm: new SourceOsm(),
      stamen: new SourceStamen({ layer: 'toner' }),
      vector: new VectorSource({
        url: 'http://mitradevel.cshl.org/webtools/seriesbrowser/getatlasgeojson/PMD2057/0025/',
        format: new GeoJSON(),
        wrapX: false,
      })
    };

    this.delVector = new VectorSource({
      wrapX: false
    });

    this.layerTile = new LayerTile({
      source: this.sources.osm
    });

    this.vectorSource = new VectorSource({
      wrapX: false
    });

    this.vector = new VectorLayer({
      source : this.vectorSource,
    });

    this.modifyVector = new VectorLayer({
      source: new VectorSource({
        url: 'http://mitradevel.cshl.org/webtools/seriesbrowser/getatlasgeojson/PMD2057/0025/',
        format: new GeoJSON(),
        wrapX: false,
      }),
    });

    this.modifyVector.getStyle().apply();

    this.select = new Select({
      wrapX: false,
    });

    this.modify = new Modify({
      features: this.select.getFeatures(),
    });

    this.draw = new Draw({
      source: this.vector.getSource(),
      type: 'Polygon',
      freehand: true,
    });
    
        this.styleAdd = new Style({
          fill: new Fill({
            color: 'rgba(0, 255, 0, 0.1)',
          }),
          stroke: new Stroke({
            color: '#28a745',
            width: 3,
          }),
          image: new CircleStyle({
                radius: 7,
                fill: new Fill({
                  color: '#28a745'
                }),
                stroke: new Stroke({
                  color: 'white',
                  width: 2,
                }),
          })
      });
    
    this.styleErase = new Style({
      fill: new Fill({
        color: 'rgba(255, 170, 70, 0.1)',
      }),
      stroke: new Stroke({
        color: '#f0ad4e',
        width: 3,
      }),
      image: new CircleStyle({
            radius: 7,
            fill: new Fill({
              color: '#f0ad4e'
            }),
            stroke: new Stroke({
              color: 'white',
              width: 2,
            }),
      })
    });
      
    this.addPolygon = new Draw({
      source: this.vector.getSource(),
      type: "Polygon",
      style:this.styleAdd,
    });

    this.erasePolygon = new Draw({
      source: this.vector.getSource(),
      type: "Polygon",
      style:this.styleErase,
    });


    this.defaultURL = 'http://braincircuits.org/cgi-bin/iipsrv.fcgi?FIF=/PMD2495/PMD2495%262494-F20-2016.02.26-23.11.41_PMD2495_3_0060.jp2&GAM=1&MINMAX=1:0,255&MINMAX=2:0,255&MINMAX=3:0,255&JTL={z},{tileIndex}';

    this.httpClient.get('http://mitradevel.cshl.org/webtools/seriesbrowser/getthumbnails/4958/').subscribe(res=>{
      this.urlData = res;
    });  

    this.zoomifySource = new Zoomify({
      url: this.defaultURL,
      size: [24000, 24000],
      crossOrigin: 'anonymous',
      zDirection: -1, // Ensure we get a tile with the screen resolution or higher
    });

    this.extent = this.zoomifySource.getTileGrid().getExtent();

    this.imagery = new TileLayer({
      source: this.zoomifySource,
    });

    this.switchLayer = [
      this.layerTile, this.vector, this.modifyVector
    ]

    this.zoomifyLayer = [
      this.imagery, this.modifyVector, this.vector
    ]

    this.modifyVector.setVisible(false);
    this.redoStack   = [];

    this.invertString = 0;
    this.HueString = 0
    this.SaturationString = 100;
    this.invertValue = "";
    this.individualRegion = 'http://mitradevel.cshl.org/webtools/seriesbrowser/getatlasgeojson/PMD2495/0060/';

    this.map = new Map({
      target: 'map',
      interactions: defaultInteractions().extend([this.select, this.modify,]),
      layers: this.zoomifyLayer,
      view: new View({
        resolutions: this.imagery.getSource().getTileGrid().getResolutions(),
        zoom: 2,
        extent: this.extent,
        constrainResolution: true
      }),
    });

    this.map.getView().fit(this.extent);

    this.addPolygon.setActive(false);
    this.erasePolygon.setActive(false);
  
    this.vector.on("prerender",(event)=>{
      this.setPolyStyle();
    });

    /*this.addPolygon.on("drawstart",(event)=>{
      this.setPolyStyle();
    });
    this.addPolygon.on("drawend",(event)=>{
      this.setPolyStyle();

    });*/

  }

  setPolyStyle(){
        var vector_sr = this.vector.getSource();
        var features = vector_sr.getFeatures();

        var bugFeature = new Feature;
        if(parseInt(features[features.length-1].ol_uid)> this.lastol_uid == true)
        { 
            if(this.erasePolygon.getActive() == true && features[features.length - 1].getStyle() == null ){ //check if style is already set
                  features[features.length -1].setStyle(this.styleErase);
                  features[features.length -1].set("name","erase");
                  this.featureStack.push(features[features.length -1]);
                  var format = new GeoJSON();
                  var temp = {"action":"Erase","geoJson":JSON.parse(format.writeFeatures([features[features.length -1]]))}
                  this.saveJson["userActions"].push(temp);   
                  this.lastol_uid = parseInt(features[features.length -1].ol_uid);
                  this.last_size = this.last_size+1;    
            }
            else if(this.addPolygon.getActive() == true && features[features.length - 1].getStyle() == null){//check if style is already set
                  features[features.length -1].setStyle(this.styleAdd);
                  features[features.length -1].set("name","add");
                  this.featureStack.push(features[features.length -1]);
                  var format = new GeoJSON();
                  var temp = {"action":"Add","geoJson":JSON.parse(format.writeFeatures([features[features.length -1]]))}
                  this.saveJson["userActions"].push(temp);
                  this.lastol_uid = parseInt(features[features.length -1].ol_uid);
                  this.last_size = this.last_size+1;     
            }
        }
        else if(features.length > this.last_size){ // the feature in vector source are not ordered due to last feature added to vector.
            
            var flag = 0;
            for(var i =0;i<features.length;i++){
              if(parseInt(features[i].ol_uid)>this.lastol_uid){//get the feature which caused disorder in vector source
                    bugFeature = features[i];
                    flag = 1;
                    vector_sr.removeFeature(vector_sr.getFeatureByUid(features[i].ol_uid));      
              } 
            }
            if(flag == 1){
              if(this.addPolygon.getActive() == true){
                bugFeature.setStyle(this.styleAdd);
                bugFeature.set("name","add");
              }
              else{
                bugFeature.setStyle(this.styleErase);
                bugFeature.set("name","erase");
              }
              vector_sr.addFeature(bugFeature);
              this.featureStack.push(bugFeature);
              var temp = {"action":"Erase","geoJson":JSON.parse(format.writeFeatures([bugFeature]))}
              this.saveJson["userActions"].push(temp);
              this.last_size = this.last_size+1;
              this.lastol_uid = parseInt(bugFeature.ol_uid);
            }
          
        }
  }

  resetToDefault = () => {
    const that = this;
    that.invertString = 0;
    that.HueString = 0
    that.SaturationString = 100;
    this.map.on('postcompose', function(e){
      console.log("imhere", this.invertValue);
      document.querySelector('canvas').style.filter="";
    });
  }

  savePolygonsToFirebase = () => {
    //const coordinates = this.map.getLayers().item(1).getSource().getFeatures()[0].values_.geometry.flatCoordinates;
    //const type = this.map.getLayers().item(1).getSource().getFeatures()[0].getGeometry().getType();
    var writer = new GeoJSON();
    var geojsonStr = writer.writeFeatures(this.vector.getSource().getFeatures());
    /*const data = {
      'string': "geojsonStr",
      "geometry": {
        "type": "Polygon",
        "coordinates": coordinates,
      },
    };*/

    var outObj_atlas = { 
      imagename: this.brainID,
      series_id: "" + this.PMDID,
      section_id: ""+ this.secNo,
      section: "" + this.secNo,
    };
    //outObj_atlas.atlas = JSON.stringify(app.atlas);
    var apifunName = '/saveatlas_status_wp/';
    console.log("save works", geojsonStr, outObj_atlas);
    /*$(function () {
      // 6 create an instance when the DOM is ready
      function nodeExpand(node){
        if (node.children.length === 0)
          return {text:node.name,...node};
        else 
          for(var i=0;i<node.children.length;i++){
            node.children[i] = nodeExpand(node.children[i]);
          }
          return {text:node.name,...node};
      }
      $(".search-input").keyup(function () {
        var searchString = $(this).val();
        $('#atlas_info').jstree('search', searchString);
      });
    
      $.getJSON('https://raw.githubusercontent.com/Sai-Adarsh/viewer-geojson/main/h.json',function(jsonresponse) {
        var dataNode=nodeExpand(jsonresponse.msg[0]);
        $('#atlas_info')
        .on("changed.jstree", function (e, data) {
          if(data.selected.length) {
            //alert('The selected node is: ' + data.instance.get_node(data.selected[0]).text);
            //console.log(data.selected);

            console.log('The selected node is: ' + data.selected[0]);//data.instance.get_node(data.selected[0]).text);
            // if(data.selected.length == 1)
            //   drawAtlasRegion(data.selected);
            // else{
            //   failMessage('<h5>Please select only one</h5>');
            //   return;
            // }
          }
        })
        .jstree({ 
          "plugins" : ["search"],
          'core' : {
            'themes': {
              'name': 'proton',
              'responsive': true,
              'icons': false,
              'variant': 'large',
              'dots': true,
            },
            'multiple': false,
            // 'check_callback': true,
            'data' :function(node,cb){
                  if(node.id === '#'){
                    cb({...dataNode},dataNode.children);
                    }
                }
          },
          "search": {
            "case_insensitive": true,
            "show_only_matches" : true
          }});
      })
    });*/
    const db = firebase.database().ref().child("vector").push(geojsonStr);
  }

  retrievePolygonsFromFirebase = () => {
    console.log("works here");
    firebase.database().ref('vector').once('value', snapshot => {
      var items = [];
      snapshot.forEach((child) => {
        items.push(child.val());
      });
      this.loadedFeature = items[items.length - 1];
    }).then( () => {
      this.loadPolygonsFromFirebase()
    });
  }

  loadPolygonsFromFirebase = () => {
    console.log(this.loadedFeature);
    var reader = new GeoJSON();
    const newGeoJson = reader.readFeatures(this.loadedFeature);
    console.log("works here", newGeoJson);
    var i;
    for (i = 0; i < newGeoJson.length; i++) {
      this.vector.getSource().addFeature(newGeoJson[i]);
    }
    //this.vector.getSource().addFeature(newGeoJson[0]);
  }


  onInvertChange = (event) => {

    const that = this;
    that.invertString = event.value;
    console.log(that.invertString);
    this.map.on('postcompose', function(e){
      this.invertValue = "invert(" + that.invertString + "%) " + "hue-rotate(" + that.HueString + "deg) " + "saturate(" + that.SaturationString + "%)";
      console.log("imhere", this.invertValue);
      document.querySelector('canvas').style.filter=this.invertValue;
    });
  };

  onHueChange = (event) => {
    const that = this;
    that.HueString = event.value;
    this.map.on('postcompose',function(e){
      this.invertValue = "invert(" + that.invertString + "%) " + "hue-rotate(" + that.HueString + "deg) " + "saturate(" + that.SaturationString + "%)";
      console.log("imhere", this.invertValue);
      document.querySelector('canvas').style.filter=this.invertValue;
    });
  };

  onSaturationChange = (event) => {
    const that = this;
    that.SaturationString = event.value;
    this.map.on('postcompose',function(e){
      this.invertValue = "invert(" + that.invertString + "%) " + "hue-rotate(" + that.HueString + "deg) " + "saturate(" + that.SaturationString + "%)";
      console.log("imhere", this.invertValue);
      document.querySelector('canvas').style.filter=this.invertValue;
    });
  };

  onToggle(event) {
    this.modifyVector.getSource().clear();
    if (event.checked == true) {
      this.lastChecked = true;
      this.httpClient.get('http://mitradevel.cshl.org/webtools/seriesbrowser/getatlasgeojson/' + this.PMDID + '/00' + this.defaultGeoJSONSecNo + '/').subscribe(res=>{
        var atlasstyle = new Style({
          fill: new Fill({
              color: 'rgba(255, 255, 255, 0)'
          }),
          stroke: new Stroke({
              color: '#0c0c0c', //'#2F7B63',
              width: 2
            }),
              text: new Text({
                  font: '12px Calibri,sans-serif',
                  fill: new Fill({
                      color: '#000'
                  }),
                  stroke: new Stroke({
                      color: '#fff',
                      width: 3
                  })
              })
        });
        console.log(this.defaultGeoJSONSecNo);
        res = JSON.stringify(res);
        var reader = new GeoJSON();
        const newGeoJson = reader.readFeatures(res);
        var i;
        for (i = 0; i < newGeoJson.length; i++) {
          newGeoJson[i].setStyle(atlasstyle);
          this.modifyVector.getSource().addFeature(newGeoJson[i]);
        }
      });
      this.modifyVector.setVisible(true);
    }
    else {
      this.lastChecked = false;
      this.modifyVector.setVisible(false);
    }
  }

  displayFeatures() {
    var defaultStyle = new Style({
      fill: new Fill({
        color: 'transparent'
      }),
      stroke: new Stroke({
        color: '#000', //'#2F7B63',
        width: 2
      }),
      text: new Text({
          font: '12px Calibri,sans-serif',
          fill: new Fill({
              color: '#000'
          }),
          stroke: new Stroke({
              color: '#fff',
              width: 3
          })
      })
    });

    if (this.lastRegionID != -1) {
      this.modifyVector.getSource().getFeatureById(this.lastRegionID).setStyle(defaultStyle);
    }

    var atlasstyle = new Style({
      fill: new Fill({
          color: 'rgba(255, 255, 255, 0.4)'
      }),
      stroke: new Stroke({
          color: '#2F7B63', //'#2F7B63',
          width: 3
        }),
          text: new Text({
              font: '12px Calibri,sans-serif',
              fill: new Fill({
                  color: '#FF0000'
              }),
              stroke: new Stroke({
                  color: '#fff',
                  width: 3
              })
          })
    });
    console.log(this.modifyVector);
    this.modifyVector.getSource().getFeatureById(this.treeRegion).setStyle(atlasstyle);
    //this.modifyVector.getSource().addFeature(newGeoJson[newGeoJson.length - 1]);
    //this.modifyVector.getSource().getFeatureById(this.treeRegion).setStyle(atlasstyle);
    //newGeoJson[newGeoJson.length - 1].setStyle(atlasstyle);
    this.lastRegionID = this.treeRegion;
    console.log(this.treeRegion, this.individualRegion);
  }

  addPolygons(){
    this.draw.setActive(false);
    this.erasePolygon.setActive(false);
    this.addPolygon.setActive(true);
    this.map.addInteraction(this.addPolygon);
    
  }

  erasePolygons(){
    this.draw.setActive(false);
    this.addPolygon.setActive(false);
    this.erasePolygon.setActive(true);
    this.map.addInteraction(this.erasePolygon);  
  }

  combine(){
    var vector_sr = this.vector.getSource();
    var features = this.featureStack;
    var format = new GeoJSON();
    var turfpoly;
    var polygon;
    var count = 0;
    var sty = new Style({
      fill: new Fill({
        color: 'rgba(0,255,255, 0.1)',
      }),
      stroke: new Stroke({
        color: '	#00FFFF',
        width: 3,
      })
    });

    var last = turf.polygon([]);
    
    for(var i = 0;i<features.length;i++){
      
        turfpoly = format.writeFeatureObject(features[i]);
        if(count>0){
            if(features[i].get('name')=="add"){
              var uid = features[i].ol_uid;
              vector_sr.removeFeature(vector_sr.getFeatureByUid(uid));
              //console.log(isIntersected," check");
              polygon = turf.union(polygon,turfpoly);
            }
            else if(count>0 && features[i].get('name')=="erase"){
              var uid = features[i].ol_uid;
              vector_sr.removeFeature(vector_sr.getFeatureByUid(uid));
              last = polygon;
              polygon = turf.difference(polygon,turfpoly);
              if(polygon==null){
                //console.log(turf.getCoords(polygon)[0],"points");
                //var points = turf.points(turf.getCoords(polygon)[0]);
                //var len = points.features.length;
                //if(false && turf.pointsWithinPolygon(points,turfpoly).features.length==len){
                //  polygon = turf.difference(polygon,turfpoly);
                //}
                //else{
                  //polygon = turf.difference(turf.toWgs84(polygon),turf.toWgs84(turfpoly));//
                  var poly1 = turf.getCoords(last);
                  var poly2 = turf.getCoords(turfpoly);
                  var polyDiff;
                  polyDiff = polygonClipping.difference(poly1, poly2);
                  polyDiff = turf.multiPolygon(polyDiff);
                  polygon = polyDiff;
                //} 
              }
            }
        }
        else{ 
          var uid = features[i].ol_uid;
          vector_sr.removeFeature(vector_sr.getFeatureByUid(uid));
          polygon = format.writeFeatureObject(features[i]);
          count = count+1;
        }
    }
    if(count>0 && polygon!=null){  
        polygon = format.readFeatures(polygon)[0];
        polygon.setStyle(sty);
        this.lastol_uid = parseInt(polygon.ol_uid);
        this.last_size = 1;
        this.featureStack = [polygon];
        vector_sr.addFeature(polygon);
    }
    //console.log(vector_sr.getFeatures());
    this.vector.setSource(vector_sr);
    this.saveJson["outputCombine"] = JSON.parse(format.writeFeatures(features));
  }

  addInteraction(interactionType) {
    this.draw.setActive(true);
    this.addPolygon.setActive(false);
    this.erasePolygon.setActive(false);
    this.draw = new Draw({
      source: this.vector.getSource(),
      type: interactionType,
      freehand: true,
    });
    this.map.addInteraction(this.draw);
  }

  
  removeInteraction(){
    this.draw.setActive(false);
    this.addPolygon.setActive(false);
    this.erasePolygon.setActive(false);
    this.map.removeInteraction(this.draw);
  }

  deleteDrawing() {
    try {
      this.toBeDeleted = this.vector.getSource().getFeatures()[this.vector.getSource().getFeatures().length - 1];
      this.vector.getSource().removeFeature(this.toBeDeleted);
      this.redoStack.push(this.toBeDeleted);
    console.log(this.redoStack);
    } catch (error) {
      console.log("No more undos");
    }
    
  }

  redoDrawing() {
    try {
      this.toBeRedrawn = this.redoStack[this.redoStack.length - 1]
      this.vector.getSource().addFeature(this.toBeRedrawn);
      this.redoStack.pop();
    } catch (error) {
      console.log("No more redos");
    }
    
  }

  getBrainIDUpdated(event) {
    this.brainID = parseInt(event.target.value);    
    console.log("brainid", this.brainID);
  }

  emailUpdated(event) {
    this.secNo = parseInt(event.target.value);
    this.defaultGeoJSONSecNo = parseInt(event.target.value);
    
    console.log("section", this.secNo);
  }

  brainIDUpdated() {
    this.modifyVector.setVisible(false);
    console.log(this.brainID, this.secNo);
    this.httpClient.get('http://mitradevel.cshl.org/webtools/seriesbrowser/getthumbnails/' + this.brainID + '/').subscribe(res=>{
      this.urlData = res;
      console.log("here", res);
      this.PMDID = this.urlData.F[this.secNo][1].split('/brainimg')[1].slice(1, 8);
      var newURL = "http://braincircuits.org/cgi-bin/iipsrv.fcgi?FIF=" + this.urlData.F[this.secNo][1].split('/brainimg')[1].replace("&","%26").replace("jpg","jp2") + "&GAM=1&MINMAX=1:0,255&MINMAX=2:0,255&MINMAX=3:0,255&JTL={z},{tileIndex}";
      this.zoomifySource = new Zoomify({
        url: newURL,
        size: [24000, 18000],
        crossOrigin: 'anonymous',
        zDirection: -1, // Ensure we get a tile with the screen resolution or higher
      });
      this.defaultURL = newURL;
      this.imagery.setSource(this.zoomifySource);
      console.log(this.defaultURL);
      if (this.selectedValue == 'nissl') {
        var event = {
          checked: true,
        };
        this.onToggleTracer(event);
      }
      else {
        var event = {
          checked: false,
        };
        this.onToggleTracer(event);
      }
    });
    console.log(this.lastChecked, this.defaultGeoJSONSecNo);
    if (this.lastChecked == true) {
      this.httpClient.get('http://mitradevel.cshl.org/webtools/seriesbrowser/getatlasgeojson/' + this.PMDID + '/00' + this.defaultGeoJSONSecNo + '/').subscribe(res=>{
        var atlasstyle = new Style({
          fill: new Fill({
              color: 'rgba(255, 255, 255, 0)'
          }),
          stroke: new Stroke({
              color: '#0c0c0c', //'#2F7B63',
              width: 2
            }),
              text: new Text({
                  font: '12px Calibri,sans-serif',
                  fill: new Fill({
                      color: '#000'
                  }),
                  stroke: new Stroke({
                      color: '#fff',
                      width: 3
                  })
              })
        });
        console.log("check geojson", this.defaultGeoJSONSecNo, res);
        res = JSON.stringify(res);
        var reader = new GeoJSON();
        const newGeoJson = reader.readFeatures(res);
        this.modifyVector.getSource().clear();
        var i;
        for (i = 0; i < newGeoJson.length; i++) {
          newGeoJson[i].setStyle(atlasstyle);
          this.modifyVector.getSource().addFeature(newGeoJson[i]);
        }
      });
      this.modifyVector.setVisible(true);
    }

  }


  onToggleTracer(event) {
    if (event.checked == true) {
      this.httpClient.get('http://mitradevel.cshl.org/webtools/seriesbrowser/getthumbnails/' + this.brainID + '/').subscribe(res=>{
        this.urlData = res;
        console.log(res);
        var toggleSecNo;
        if (this.secNo - 4 < 0) {
          toggleSecNo = 0;
        }
        else {
          toggleSecNo = this.secNo - 4;
        }
        var newURL = "http://braincircuits.org/cgi-bin/iipsrv.fcgi?FIF=" + this.urlData.N[toggleSecNo][1].split('/brainimg')[1].replace("&","%26").replace("jpg","jp2") + "&GAM=1&MINMAX=1:0,255&MINMAX=2:0,255&MINMAX=3:0,255&JTL={z},{tileIndex}";
        this.zoomifySource = new Zoomify({
          url: newURL,
          size: [24000, 24000],
          crossOrigin: 'anonymous',
          zDirection: -1, // Ensure we get a tile with the screen resolution or higher
        });
        this.defaultURL = newURL;
        this.imagery.setSource(this.zoomifySource);
        console.log(this.defaultURL);
      });
      console.log(this.defaultURL, this.urlData);
    }
    else {
      this.httpClient.get('http://mitradevel.cshl.org/webtools/seriesbrowser/getthumbnails/' + this.brainID + '/').subscribe(res=>{
        this.urlData = res;
        console.log(res);
        var newURL = "http://braincircuits.org/cgi-bin/iipsrv.fcgi?FIF=" + this.urlData.F[this.secNo][1].split('/brainimg')[1].replace("&","%26").replace("jpg","jp2") + "&GAM=1&MINMAX=1:0,255&MINMAX=2:0,255&MINMAX=3:0,255&JTL={z},{tileIndex}";
        this.zoomifySource = new Zoomify({
          url: newURL,
          size: [24000, 24000],
          crossOrigin: 'anonymous',
          zDirection: -1, // Ensure we get a tile with the screen resolution or higher
        });
        this.defaultURL = newURL;
        this.imagery.setSource(this.zoomifySource);
        console.log(this.defaultURL);
      });
    }
  }



  REPL() {
    if (this.myControl.value == "turnOnGEOJson") {
      const event = {
        checked: true,
      };
      this.lastChecked = true;
      this.onToggle(event);
    };
    if (this.myControl.value == "turnOffGEOJson") {
      this.lastChecked = false;
      this.modifyVector.setVisible(false);
    };
    if (this.myControl.value == "savePolygons") {
      this.savePolygonsToFirebase();
    };
    if (this.myControl.value == "retrievePolygons") {
      this.retrievePolygonsFromFirebase();
    };
    if (this.myControl.value == "loadPolygons") {
      this.loadPolygonsFromFirebase();
    }  
  }

  Tree(event) {
    this.httpClient.get('https://raw.githubusercontent.com/Sai-Adarsh/viewer-geojson/main/h.json').subscribe(res=>{
        console.log("here", res);
        this.treeString = [];
        this.treeString.push(res);
    });
  
  }

  PrintTree() {
    console.log("Print Tree", typeof this.treeString[0]["msg"], this.treeString[0]["msg"]);
  }

  handleFileLoad(event){
    var vector_sr = this.vector.getSource();
    var features = vector_sr.getFeatures();
    
    var content = JSON.parse(event.target.result);
    var format = new GeoJSON();
    if(content["outputCombine"]["type"]!= undefined || content["outputCombine"].length!=undefined ){
        var featuresToLoad = format.readFeatures(content["outputCombine"]);
        console.log(featuresToLoad);
        for(var i=0;i<featuresToLoad.length;i++){
            if(featuresToLoad[i].get("name")=="add"){
                featuresToLoad[i].setStyle(this.styleAdd);
            }
            else if(featuresToLoad[i].get("name")=="erase"){
                featuresToLoad[i].setStyle(this.styleErase);
            }
            vector_sr.addFeature(featuresToLoad[i]);
        }
      this.saveJson["firstpassAtlas"] =  content["outputCombine"]; 
    }
  }

  importFile(event) {
    if (event.target.files.length == 0) {
       console.log("No file selected!");
       return
    }
    var file: File = event.target.files[0];
    
    const reader = new FileReader();
    reader.readAsText(event.target.files[0]);
    reader.onload = (event) => {
      var vector_sr = this.vector.getSource();
      var features = vector_sr.getFeatures();
      console.log("here", event.target.result)
      var fileString = event.target.result;
      var content = JSON.parse(JSON.parse(JSON.stringify(fileString)));
      var format = new GeoJSON();
      if(content["outputCombine"]["type"]!= undefined || content["outputCombine"].length!=undefined ){
          var featuresToLoad = format.readFeatures(content["outputCombine"]);
          console.log(featuresToLoad);
          for(var i=0;i<featuresToLoad.length;i++){
              if(featuresToLoad[i].get("name")=="add"){
                  featuresToLoad[i].setStyle(this.styleAdd);
              }
              else if(featuresToLoad[i].get("name")=="erase"){
                  featuresToLoad[i].setStyle(this.styleErase);
              }
              vector_sr.addFeature(featuresToLoad[i]);
          }
        this.saveJson["firstpassAtlas"] =  content["outputCombine"]; 
      }
    };

  
      // after here 'file' can be accessed and used for further process
  }

  setCheckPoint() {
    this.saveJson["userActions"] = [];
    this.saveJson["firstpassAtlas"] = this.saveJson["outputCombine"]
    this.saveJson["outputCombine"] = {};
  }

  exportFile(event) {
      console.log("Saving File");
      this.combine();
      var json = this.saveJson;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([JSON.stringify(json, null, 2)], {
        type: "text/plain"
      }));
      a.setAttribute("download", "feature.json");
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      this.setCheckPoint();  
  }

}
