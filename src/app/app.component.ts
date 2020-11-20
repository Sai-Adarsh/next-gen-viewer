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
import { fromLonLat } from 'ol/proj';
import { defaults as defaultControls } from 'ol/control';
import { defaults as defaultInteractions, PinchZoom, Modify, Select } from 'ol/interaction';
import { Injectable } from '@angular/core';
import 'ol/ol.css';
import {Circle as CircleStyle, Fill, Stroke, Style} from 'ol/style';
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

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit, OnInit  {

  constructor(private _snackBar: MatSnackBar) {}

  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 2000,
    });
  }

  myControl = new FormControl();
  options: string[] = ['turnOnGEOJson', 'turnOffGEOJson', 'Three'];
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

    this.sources = {
      osm: new SourceOsm(),
      stamen: new SourceStamen({ layer: 'toner' }),
      vector: new VectorSource({
        url: 'https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json',
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
        crossOrigin: 'anonymous',
        zDirection: -1, // Ensure we get a tile with the screen resolution or higher
        size: [24000, 24000],
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


    this.zoomifySource = new Zoomify({
      url: 'http://braincircuits.org/cgi-bin/iipsrv.fcgi?FIF=/PMD2057/PMD2057%262056-F9-2015.03.06-17.55.48_PMD2057_1_0025.jp2&GAM=1&MINMAX=1:0,255&MINMAX=2:0,255&MINMAX=3:0,255&JTL={z},{tileIndex}',
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
    if (event.checked == true) {
      console.log("imhere");
      this.modifyVector.setVisible(true);
    }
    else {
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
      console.log(vector_sr.getFeatures());
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

  REPL() {
    if (this.myControl.value == "turnOnGEOJson") {
      this.modifyVector.setVisible(true);
    };
    if (this.myControl.value == "turnOffGEOJson") {
      this.modifyVector.setVisible(false);
    };
  }

}
