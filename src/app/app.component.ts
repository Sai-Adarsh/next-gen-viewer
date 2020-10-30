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
        url: 'https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json',
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

    this.switchLayer = [
      this.layerTile, this.vector, this.modifyVector
    ]

    this.modifyVector.setVisible(false);
    this.redoStack   = [];

    this.map = new Map({
      target: 'map',
      interactions: defaultInteractions().extend([this.select, this.modify]),
      layers: this.switchLayer,
      view: new View({
        center: fromLonLat([0, 0]),
        zoom: 2,
        constrainResolution: true
      }),
    });

  }

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
