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

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit, OnInit  {

  constructor(private _snackBar: MatSnackBar, private httpClient: HttpClient) {}

  public urlData;
  public secNo;
  
  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 2000,
    });
  }

  myControl = new FormControl();
  options: string[] = ['turnOnGEOJson', 'turnOffGEOJson', 'savePolygons', 'retrievePolygons', 'loadPolygons'];
  filteredOptions: Observable<string[]>;

  ngOnInit() {
    this.filteredOptions = this.myControl.valueChanges
      .pipe(
        startWith(''),
        map(value => this._filter(value))
      );
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


    this.defaultURL = 'http://braincircuits.org/cgi-bin/iipsrv.fcgi?FIF=/PMD2057/PMD2057%262056-F20-2015.03.06-21.13.19_PMD2057_3_0060.jp2&GAM=1&MINMAX=1:0,255&MINMAX=2:0,255&MINMAX=3:0,255&JTL={z},{tileIndex}';

    this.httpClient.get('http://mitradevel.cshl.org/webtools/seriesbrowser/getthumbnails/4240/').subscribe(res=>{
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
      this.imagery, this.vector, this.modifyVector
    ]

    this.modifyVector.setVisible(false);
    this.redoStack   = [];

    this.invertString = 0;
    this.HueString = 0
    this.SaturationString = 100;
    this.invertValue = "";

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
  
    this.vector.on("postrender",(event)=>{
      this.setPolyStyle();
    });

    this.addPolygon.on("drawstart",(event)=>{
      this.setPolyStyle();
    });
    this.addPolygon.on("drawend",(event)=>{
      this.setPolyStyle();

    });

  }

  setPolyStyle(){
    var vector_sr = this.vector.getSource();
    var features = vector_sr.getFeatures();
    if(features.length>0 &&this.erasePolygon.getActive() == true && features[features.length - 1].getStyle() == null){
            features[features.length -1].setStyle(this.styleErase);
            features[features.length -1].set("name","erase");
    }
    else if(features.length>0 && this.addPolygon.getActive() == true && features[features.length - 1].getStyle() == null){
            features[features.length -1].setStyle(this.styleAdd);
            features[features.length -1].set("name","add");
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
    console.log("save works", geojsonStr);
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
      this.httpClient.get('http://mitradevel.cshl.org/webtools/seriesbrowser/getatlasgeojson/PMD2057/00' + this.defaultGeoJSONSecNo + '/').subscribe(res=>{
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
    try {
      var vector_sr = this.vector.getSource();
      var features = vector_sr.getFeatures();
      var format = new GeoJSON();
      var turfpoly;
      var polygon;
      var count = 0;
      var sty = new Style({
        fill: new Fill({
          color: 'rgba(0,255,255, 0.1)',
        }),
        stroke: new Stroke({
          color: '#00FFFF',
          width: 3,
        })
      });
      var isIntersected = turf.polygon([]);
      for(var i = 0;i<features.length;i++){
        
          turfpoly = format.writeFeatureObject(features[i]);
          if(count>0){
              if(features[i].get('name')=="add"){
                var uid = features[i].ol_uid;
                vector_sr.removeFeature(vector_sr.getFeatureByUid(uid));
                polygon = turf.union(polygon,turfpoly);
              }
              else if(count>0 && features[i].get('name')=="erase"){
                var uid = features[i].ol_uid;
                vector_sr.removeFeature(vector_sr.getFeatureByUid(uid));
                polygon = turf.difference(polygon,turfpoly);
              }
          }
          else{ 
            var uid = features[i].ol_uid;
            vector_sr.removeFeature(vector_sr.getFeatureByUid(uid));
            polygon = format.writeFeatureObject(features[i]);
            count = count+1;
          }
      }
      if(count>0){  
          polygon = format.readFeatures(polygon)[0]
          polygon.setStyle(sty);
          vector_sr.addFeature(polygon);
      }
      console.log(vector_sr);
      this.vector.setSource(vector_sr);
    } catch (error) {
      console.log("Select region inside added polygon");
    }
    
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

  emailUpdated(event) {
    this.secNo = parseInt(event.target.value);
    this.defaultGeoJSONSecNo = parseInt(event.target.value);
    
    console.log("section", this.secNo);
  }

  brainIDUpdated() {
    this.modifyVector.setVisible(false);
    this.httpClient.get('http://mitradevel.cshl.org/webtools/seriesbrowser/getthumbnails/4240/').subscribe(res=>{
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
    console.log(this.lastChecked, this.defaultGeoJSONSecNo);
    if (this.lastChecked == true) {
      this.httpClient.get('http://mitradevel.cshl.org/webtools/seriesbrowser/getatlasgeojson/PMD2057/00' + this.defaultGeoJSONSecNo + '/').subscribe(res=>{
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
      this.httpClient.get('http://mitradevel.cshl.org/webtools/seriesbrowser/getthumbnails/4240/').subscribe(res=>{
        this.urlData = res;
        console.log(res);
        var newURL = "http://braincircuits.org/cgi-bin/iipsrv.fcgi?FIF=" + this.urlData.N[this.secNo][1].split('/brainimg')[1].replace("&","%26").replace("jpg","jp2") + "&GAM=1&MINMAX=1:0,255&MINMAX=2:0,255&MINMAX=3:0,255&JTL={z},{tileIndex}";
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
      this.httpClient.get('http://mitradevel.cshl.org/webtools/seriesbrowser/getthumbnails/4240/').subscribe(res=>{
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

}
