// set up colors for map in quintiles
const quin_1 = '#b13f64';
const quin_2 = '#d55d6a';
const quin_3 = '#ea8171';
const quin_4 = '#f3aa84';
const quin_5 = '#f6d2a9';

const mapboxKey = ''; // enter your mapbox key here, please contact me to request one if you'd like to test the app
const legend = document.getElementById('legend');
const addressInput = document.getElementById('address');
const searchbar = document.getElementById('searchbar');
const infobar = document.getElementById('infobar');
const addressList = document.getElementById('addressSuggestions');

const debounce = (func, delay) => { // "debounce" ensures repeat autocomplete requests aren't sent if typing quickly
  let inDebounce;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(inDebounce);
    inDebounce = setTimeout(() => func.apply(context, args), delay);
  };
};
const debouncedAutocomplete = debounce(getAutocomplete, 250);


// labels for the legend
const tractLabels = [
  '< 52% self-response rate',
  '52 – 55%',
  '56 – 61%',
  '62 – 67%',
  '> 67% '
];

const neighborhoodLabels = [
  '< 56% self-response rate',
  '56 – 60%',
  '61 – 64%',
  '64 – 67%',
  '> 67%'
];

const colors = [quin_1, quin_2, quin_3, quin_4, quin_5]; //colors in order

// Variable for storing highlighted layer
const highlight;

const style = {
    'default': {
        'color': '#ffffff',
        'weight': 0.5
    },
    'highlight': {
        'color': 'red',
        'weight': 2
    }
};

let infoControl = L.Control.extend({ //create button to view details about the map
  options: {
    position: 'bottomleft',
  },
  onAdd: function(map) {
    let infoButton = L.DomUtil.create('button','leaflet-info-control surface');
    let background = L.DomUtil.create('i', 'material-icons md-24');
    infoButton.style.width = '34px';
    infoButton.style.height = '34px';
    background.innerText = 'help_outline';
    infoButton.onclick = toggleInfo;
    infoButton.appendChild(background);
    return infoButton;
  }
});

let customControl = new infoControl();

function hideLegend() {
  document.getElementById('infobarTop').style.display = 'none';
  document.getElementById('legend').style.display = 'none';
}

function unhideLegend() {
  document.getElementById('infobarTop').style.display = 'flex';
  document.getElementById('legend').style.display = 'flex';
}

function toggleInfo() { //show and unshow the info box
  infobar.style.display = window
    .getComputedStyle(infobar)
    .getPropertyValue('display');
  if (infobar.style.display == 'flex') {
    infobar.style.display = 'none';
    customControl.addTo(mainMap);
  } else {
    infobar.style.display = 'flex';
    mainMap.removeControl(customControl);
  }
}

//add event listeners for search bar
document.getElementById('submit').addEventListener('click', function() {
  geocodeAndDraw(addressInput.value);
});
document.getElementById('infoX').addEventListener('click', toggleInfo);
document
  .getElementById('address')
  .addEventListener('input', debouncedAutocomplete);

//initialize map
let mainMap = L.map('mapid', {
  zoomControl: false,
  maxBounds: [[40.47, -74.5], [40.95, -73.4]],
  minZoom: 11,
  maxZoom: 16,
}).setView([40.71478, -73.9789], 11); //add this

var zoomControl = new L.control.zoom({position: 'topleft'}).addTo(mainMap);

//add tile layer
L.tileLayer(
  'https://api.mapbox.com/styles/v1/danielburton/cjxxicci6400z1cqtjaq9b8vc/tiles/256/{z}/{x}/{y}@2x?access_token={accessToken}',
  {
    attribution:
      'Tract Data U.S. Census Bureau, Imagery <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 16,
    id: 'mapbox.light',
    accessToken: mapboxKey
  }
).addTo(mainMap);

async function geocodeAddress(address) { //sends the address to NY city planning's API and gets the latitude and longitude
  let query = `https://geosearch.planninglabs.nyc/v1/search?text=${address}`;
  const response = await fetch(query);
  const reJson = await response.json(); //response Json
  console.log(reJson['features'][0]['geometry']['coordinates'][1], reJson['features'][0]['geometry']['coordinates'][0])
  return [
    reJson['features'][0]['geometry']['coordinates'][1],
    reJson['features'][0]['geometry']['coordinates'][0],
    reJson['features'][0]['properties']['label']
  ];
}

let addressMarker; //store address marker so it can be removed

function addMarker(lat, long, label) {
  // add a marker at a given location with label
  leafletPip.bassackwards = true; //internal leafletPip setting to use lat-long rather than long-lat
  addressMarker = L.marker([lat, long], {title: 'test'}).addTo(mainMap);
  mainMap.flyTo(addressMarker.getLatLng(), 14); //center marker in view

  let containingNeighborhood = leafletPip.pointInLayer(
    [lat, long],
    neighborhoodLayer,
    true,
  )[0].feature.properties;
  label =
    '<b>' +
    label +
    '</b><br><br><b>Neighborhood:</b> ' +
    containingNeighborhood.n +
    '<br><b>Average self-response (2010):</b> ' +
    (containingNeighborhood.r * 100).toFixed(1) + '%' +
    '<br><a target="_parent" class="volunteer" href="https://www1.nyc.gov/site/census/get-involved/join-the-get-counted-team.page#volunteer-target">Sign up to volunteer</a>';
  addressMarker.bindPopup(label).openPopup();
  makeSearchX();
}

function makeSearchX() { //create X in search bar that will remove current marker if clicked
  if (document.getElementById('searchX')) {
  } else {
  let xButton = document.createElement('button');
  xButton.className = 'sideX';
  xButton.id = 'searchX';
  xButton.onclick = searchX;
  xButton.innerHTML = '<i class="material-icons md-24">close</i>';
  document.getElementById('searchBarTop').appendChild(xButton);
  }
}

function clearMarker() {
  mainMap.removeLayer(addressMarker);
}

function searchX() { //this might be broken too
  document
    .getElementById('searchBarTop')
    .removeChild(document.getElementById('searchX'));
  document.getElementById('addressData').style.display = 'none';
  addressInput.value = '';
  if (highlight) {unsetHighlight(highlight);}
  if (addressMarker) {clearMarker();}
  unhideLegend();
}

function geocodeAndDraw(address) {
  return geocodeAddress(address).then(latLong => {
    addMarker(latLong[0], latLong[1], latLong[2]);
  });
}

function checkAutocomplete(text) {
  // checks if autocomplete option has been selected, if so, add to map
  if (autocompletePoints['names'].includes(text)) {
    let lon = autocompletePoints['details'][text]['lon'];
    let lat = autocompletePoints['details'][text]['lat'];
    addMarker(lat, lon, text);
    addressInput.blur();
  }
}

let autocompletePoints = {names: [], details: {}}; // store current suggested autocompletes

async function getAutocomplete(event) {
  checkAutocomplete(event.target.value);
  let query = `https://geosearch.planninglabs.nyc/v1/autocomplete?text=${
    event.target.value
  }`;
  if (event.target.value != '' && event.target.value != ' ') {
    let response = await fetch(query);
    let points = [];
    response = response
      .json()
      .then(response => {
        for (let i = 0; i < response.features.length; i++) {
          let replaced = response.features[i].properties.label.replace(
            ', New York, NY, USA',
            '',
          );
          points.push({
            name: replaced,
            lon: response.features[i].geometry.coordinates[0],
            lat: response.features[i].geometry.coordinates[1],
          });
          autocompletePoints['names'].push(replaced);
          autocompletePoints['details'][replaced] = {
            lon: response.features[i].geometry.coordinates[0],
            lat: response.features[i].geometry.coordinates[1],
          };
        }
      })
      .then(() => {
        while (addressList.firstChild) {
          addressList.removeChild(addressList.firstChild);
        }
        for (let y = 0; y < points.length; y++) {
          let suggestion = document.createElement('option');
          suggestion.innerText = points[y].name;
          addressList.appendChild(suggestion);
        }
      });
  }
}

function getColor(r) {
  // translate quintile rank into proper color
  return r == '5'
    ? quin_5
    : r == '4'
    ? quin_4
    : r == '3'
    ? quin_3
    : r == '2'
    ? quin_2
    : r == '1'
    ? quin_1
    : '#ffffff';
}
function getOpacity(r) {
  // change opacity only if quintile "0" (park, cemetery, etc)
  return r == '0' ? 0 : 0.85;
}

function layerStyle(feature) {
  // style the neighborhood or tract based on quintile
  return {
    fillColor: getColor(feature.properties.q),
    weight: 0.5,
    opacity: 1,
    color: '#ffffff',
    fillOpacity: getOpacity(feature.properties.q)
  };
}

function neighborhoodStyle(feature) {
  // style the neighborhood based on quintile with border
  return {
    fillColor: getColor(feature.properties.q),
    weight: 1,
    opacity: 1,
    color: '#000000',
    fillOpacity: getOpacity(feature.properties.q)
  };
}

function boundaryStyle(feature) {
  // style the neighborhood boundaries
  return {
    fillColor: '#ffffff',
    weight: 1,
    opacity: 1,
    color: '#000000',
    fillOpacity: 0
  };
}

let tractLayer = L.geoJson(tractGeojson, {style: layerStyle, interative: false}).addTo(mainMap);
let neighborhoodLayer = L.geoJson(neighborhoodGeojson, {style: neighborhoodStyle});
let boundaryLayer = L.geoJson(neighborhoodGeojson, {style: boundaryStyle}).addTo(mainMap);

boundaryLayer.eachLayer(neighborhood => {
  let participation = neighborhood.feature.properties.r;
  let n = neighborhood.feature.properties.n;
  let q = neighborhood.feature.properties.q;
  neighborhood.on('click', function(e)  {
    mainMap.flyTo(e.latlng, 14);
    console.log('click');
  });
  neighborhood.bindPopup(
    '<b>Neighborhood:</b> ' +
      (q == '0' ? 'Non-Residential Area' : n) +
      '<br><b>Average self-response (2010):</b> ' +
      (q == '0' ? 'N/A' : (participation * 100).toFixed(1) + '%') +
      '<br><a target="_parent" class="volunteer" href="https://www1.nyc.gov/site/census/get-involved/join-the-get-counted-team.page#volunteer-target">Sign up to volunteer</a>',
  );
});

/*tractLayer.eachLayer(tract => {
  let n = tract.feature.properties.n;
  let nr = tract.feature.properties.nr;
  let q = tract.feature.properties.q;
  let t = tract.feature.properties.t;
  let tr = tract.feature.properties.r;
  tract.on('click', function(e)  {
    mainMap.flyTo(e.latlng, 14);
  });
  tract.bindPopup(
    '<b>Neighborhood:</b> ' +
    (q == '0' ? 'Non-Residential Area' : n) +
    '<br><b>Average self-response (2010):</b> ' +
    (q == '0' ? 'N/A' : (nr * 100).toFixed(1) + '%') +
    '<br><br><b>Census Tract:</b> ' + t +
    '<br><b>Tract self-response (2010):</b> ' +
    (q == '0' ? 'N/A' : (tr * 100).toFixed(1) + '%') +
    '<br><a target="_parent" class="volunteer" href="https://www1.nyc.gov/site/census/get-involved/join-the-get-counted-team.page#volunteer-target">Sign up to volunteer</a>'
  );
});*/

neighborhoodLayer.eachLayer(neighborhood => {
  let participation = neighborhood.feature.properties.r;
  let n = neighborhood.feature.properties.n;
  let q = neighborhood.feature.properties.q;
  neighborhood.on('click', function(e)  {
    mainMap.flyTo(e.latlng, 14);
  });
  neighborhood.bindPopup(
    '<b>Neighborhood:</b> ' +
      (q == '0' ? 'Non-Residential Area' : n) +
      '<br><b>Average self-response (2010):</b> ' +
      (q == '0' ? 'N/A' : (participation * 100).toFixed(1) + '%') +
      '<br><a target="_parent" class="volunteer" href="https://www1.nyc.gov/site/census/get-involved/join-the-get-counted-team.page#volunteer-target">Sign up to volunteer</a>',
  );
});

// create legend
for (let i = 0; i < colors.length; i++) {
  let label = document.createElement('p');
  label.innerText = tractLabels[i];
  label.setAttribute('class', 'label');
  let colorBox = document.createElement('span');
  colorBox.setAttribute('class', 'colorBox');
  colorBox.setAttribute('style', 'background:' + colors[i]);
  let para = document.createElement('p');
  para.setAttribute('class', 'labelBox');
  para.appendChild(colorBox);
  para.appendChild(label);
  legend.appendChild(para);
}

// set the labels in the legend
function setLegend(descriptions) {
  let labels = document.getElementsByClassName('label');
  for (let i = 0; i < labels.length; i++) {
    labels[i].innerText = descriptions[i];
  }
}

//select layer
//needs fix to check if current tab is 'activeTab'
let neighborhoodTab = document.getElementById('neighborhoodTab');
let tractTab = document.getElementById('tractTab');
tractTab.addEventListener('click', function() {
  mainMap.removeLayer(neighborhoodLayer);
  tractLayer.addTo(mainMap);
  boundaryLayer.addTo(mainMap);
  setLegend(tractLabels);
  neighborhoodTab.className = neighborhoodTab.className.replace(
    ' activeTab',
    '',
  );
  if (!tractTab.classList.contains('activeTab')) {tractTab.className += ' activeTab';}
});

neighborhoodTab.addEventListener('click', function() {
  mainMap.removeLayer(tractLayer);
  mainMap.removeLayer(boundaryLayer);
  neighborhoodLayer.addTo(mainMap);
  setLegend(neighborhoodLabels);
  tractTab.className = tractTab.className.replace(' activeTab', '');
  if (!neighborhoodTab.classList.contains('activeTab')) {neighborhoodTab.className += ' activeTab';}
});
