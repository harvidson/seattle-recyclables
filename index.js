let markers = [];
let map;
let bounds = new google.maps.LatLngBounds();
const infoWindow = new google.maps.InfoWindow({});
let searchID = -1;
const iconColors = ['ff6f00', '00acc1', '7cb342', '84ffff', 'ffd600',  '7b1fa2', 'ffa726', '5c6bc0', 'c6ff00', '039be5', 'd50000', '81d4fa', '64dd17', '6200ea', 'c51162'];

initMap();

$('.categories').on('click', 'li', function(event) {
  // console.log($(this).attr('id'));
  const selectedMaterial = $(this).attr('id');
    //check for a couple of special cases
  if (selectedMaterial === 'threadcycle') {
    const $toastContent = $(`<span>You can Threadcycle these items! See <a href="http://your.kingcounty.gov/solidwaste/ecoconsumer/threadcycle.asp" target="_blank">http://your.kingcounty.gov/solidwaste/ecoconsumer/threadcycle.asp</a> for details and locations.</span>`);
    Materialize.toast($toastContent, 10000, 'rounded');
  } else if (selectedMaterial === 'garbage') {
    const $toastContent = $(`<span>This material is plain old garbage. You can throw it away curbside.</span>`);
    Materialize.toast($toastContent, 4000, 'rounded');
  } else if (selectedMaterial === 'mattresses') {
    createMattressMarkers();
    //otherwise, use api call against county data to map options
  } else {
    const material = nameMatches[selectedMaterial];
    getResults(selectedMaterial, material);
  }
});

// ***********************google maps***************************

function initMap() {
  const seattle = {
    lat: 47.620828,
    lng: -122.332982
  };
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: seattle
  });
}

function createMarkers(data, selectedMaterial) {
  searchID++;

  if (newSelection(selectedMaterial)) {
    createMarkersFor(data, selectedMaterial, bounds, function(){
      map.fitBounds(bounds);
    });

  } else {
    const $toastContent = $(`<span>Places you can take <strong>${selectedMaterial}</strong> are already on the map.</span>`);
    Materialize.toast($toastContent, 4000, 'rounded');
  }
}

function createMattressMarkers() {
  searchID++
  const marker = new google.maps.Marker({
    map: map,
    position: {lat: 47.240616, lng: -122.4327794},
    title: 'Spring Back Mattress Recycling NW',
    animation: google.maps.Animation.DROP,
    icon: makeMarkerIcon(iconColors[searchID]),
    material: 'mattresses',
    address: '117 Puyallup Ave',
    city: 'Tacoma, WA',
    zip: '98421',
    phone: '253-302-3868',
    url: 'http://www.nwfurniturebank.org/spring-back-mattress-recycling',
    hours: 'Monday-Saturday 9:00 a.m. - 4:00 p.m.',
    restrictions: 'The items can be in any condition but MUST be dry.',
    description: '90% of a mattress is composed of recyclable materials. The more we can recycle, the more we can divert from landfills. For a fee we will process your mattress to ensure that it does not end up in a landfill. <br>Fees: $20 per piece for in home pick up; $10 per piece if it is brought to the furniture bank.'
  });
  markers.push(marker);
  bounds.extend(marker.position);
  map.fitBounds(bounds);
  addTags('mattresses');


  marker.addListener('click', function() {
    populateInfoWindow(this, infoWindow);
  });
}

function createMarkersFor(data, selectedMaterial, bounds, cb){
  let returnedAsync = 0;

  for (let i = 0; i < data.length; i++) {
    createMarkerPosition(data, selectedMaterial, i, function(position){
      const title = data[i].provider_name;
      const address = data[i].geolocation_address;
      const hours = data[i].hours;
      const zip = data[i].geolocation_zip;
      const phone = data[i].phone;
      const url = data[i].provider_url;
//could do something fancy here to prevent undefined
      const restrictions = data[i].restrictions;
      const description = data[i].service_description;

      const marker = new google.maps.Marker({
        map: map,
        position: position,
        title: title,
        animation: google.maps.Animation.DROP,
        icon: makeMarkerIcon(iconColors[searchID]),
        material: selectedMaterial,
        address: address,
        zip: zip,
        phone: phone,
        url: url,
        hours: hours,
        restrictions: restrictions,
        description: description
      });
      markers.push(marker);
      bounds.extend(marker.position);

      // listen for click event on each marker
      marker.addListener('click', function() {
        populateInfoWindow(this, infoWindow);
      });

      if(++returnedAsync === data.length){
        cb();
      }
    })
  }
}

function createMarkerPosition(data, selectedMaterial, i, cb) {

  if (typeof data[i].geolocation === 'object') {
    return cb({
      lat: data[i].geolocation.coordinates[1],
      lng: data[i].geolocation.coordinates[0]
    });
  } else {
    const address = data[i].geolocation_address;
    getCoordinates(address, cb);
  }
}

function getCoordinates(address, cb) {
  $.ajax({
    url: `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=AIzaSyAynp8pr3LY7S2x60jYQ5DXaJz_sMwIhho`
  }).done(function(address) {
    return cb(createPosition(address));
  }).fail(function() {
    alert("There was an error. Please search again.")
  });
}

function createPosition(address) {
  const position = {
    lat: address.results[0].geometry.location.lat,
    lng: address.results[0].geometry.location.lng
  };
  return position;
}

function makeMarkerIcon(markerColor) {
  var markerImage = new google.maps.MarkerImage(
    'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor +
    '|40|_|%E2%80%A2',
    new google.maps.Size(21, 34),
    new google.maps.Point(0, 0),
    new google.maps.Point(10, 34),
    new google.maps.Size(21, 34));
  return markerImage;
}

function populateInfoWindow(marker, infoWindow) {
  if (infoWindow.marker != marker) {
    infoWindow.marker = marker;
    infoWindow.setContent(`
      <div class="infoWindowHeader">${marker.title}</div>
      <div id="col">
        <p>${marker.address}
        <br>Seattle, WA ${marker.zip}
        <br>${marker.phone}
        </p>
        <p><br>Open ${marker.hours}</p>
        <a href="${marker.url}">${marker.url}</a>
      </div>
      <hr>
      <div>
        <p>${marker.description}</p>
        <p>${marker.restrictions}</p>
      </div>
      `)
    infoWindow.open(map, marker);
    infoWindow.addListener('closeclick', function() {
      //weird bug here--if you close the infoWindow you can't immediately click on it again to reopen
      infoWindow.close();
    });
  }
}

// ************results from King County data**************

function getResults(selectedMaterial, material) {
  $.ajax({
    url: `https://data.kingcounty.gov/resource/tzui-ygc5.json?city=Seattle&material_handled=${material}`,
    dataType: 'json'
  }).done(function(data) {
    createMarkers(data, selectedMaterial);
    addTags(selectedMaterial); //or could this go above with event listener?
  }).fail(function() {
    alert("There was an error. Please search again.")
  });
}

//create a tag when a material is selected
let tagsArray = [];

function newSelection(selectedMaterial) {
  let tagIsNew = true;

  for (let i = 0; i < tagsArray.length; i++) {
    if (tagsArray[i].tag === selectedMaterial) {
      tagIsNew = false
    }
  }
  return tagIsNew;
}

function addTags(selectedMaterial) {
  if (newSelection(selectedMaterial)) {
    tagsArray.push({
      tag: selectedMaterial,
      color: iconColors[searchID]
    });
  }

  $('.chips').material_chip({
    data: tagsArray
  });
  colorTag();
}

function colorTag() {
  for (const tag of tagsArray) {
    $(`.chip:contains('${tag.tag}')`).css("background-color", `#${tag.color}`);
  }
}

$('.chips').on('chip.delete', function(e, chip) {
  const closedMarker = chip.tag;
  deletePins(closedMarker);
  deleteTag(closedMarker);
});

function deletePins(markersToDelete) {
  for (marker of markers) {
    if (marker.material === markersToDelete) {
      marker.setMap(null)
    }
  }
}

function deleteTag(closedMarker) {
  for (let i = 0; i < tagsArray.length; i++) {
    if (tagsArray[i].tag === closedMarker) {
      tagsArray.splice(i, 1)
    }
  }
}
