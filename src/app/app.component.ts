import { AfterViewInit, Component, OnInit} from '@angular/core';
import XYZ from 'ol/source/XYZ';
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
        url: 'https://raw.githubusercontent.com/Sai-Adarsh/viewer-geojson/main/brain.geo.json',
        format: new GeoJSON(),
        wrapX: false,
      }),
    });

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
      this.imagery, this.vector
    ]

    this.modifyVector.setVisible(false);
    this.redoStack   = [];

    this.invertString = 0;
    this.HueString = 0
    this.SaturationString = 100;
    this.invertValue = "";

    this.map = new Map({
      target: 'map',
      interactions: defaultInteractions().extend([this.select, this.modify]),
      layers: this.zoomifyLayer,
      view: new View({
        resolutions: this.imagery.getSource().getTileGrid().getResolutions(),
        zoom: 2,
        extent: this.extent,
        constrainResolution: true
      }),
    });

    this.map.getView().fit(this.extent);

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
      this.modifyVector.setVisible(true);
    }
    else {
      this.modifyVector.setVisible(false);
    }
  }

  addInteraction(interactionType) {
    this.draw.setActive(true);
    this.draw = new Draw({
      source: this.vector.getSource(),
      type: interactionType,
      freehand: true,
    });
    this.map.addInteraction(this.draw);
  }

  removeInteraction(){
    this.draw.setActive(false);
    this.map.removeInteraction(this.draw);
  }

  deleteDrawing() {
    this.toBeDeleted = this.vector.getSource().getFeatures()[this.vector.getSource().getFeatures().length - 1];
    this.vector.getSource().removeFeature(this.toBeDeleted);
    this.redoStack.push(this.toBeDeleted);
    console.log(this.redoStack);
  }

  redoDrawing() {
    this.toBeRedrawn = this.redoStack[this.redoStack.length - 1]
    this.vector.getSource().addFeature(this.toBeRedrawn);
    this.redoStack.pop();
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
