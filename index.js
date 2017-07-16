//track markers added to map
let markers = [];
let map;
//determines portion of map to show
let bounds = new google.maps.LatLngBounds();
//gives more info on a marker, when clicked
const infoWindow = new google.maps.InfoWindow({});
//counts the number of times a user has clicked on a material and populated the map; used to determine marker color for that material
let searchID = -1;

//each selected material will be assigned a color from this array, in sequence
const iconColors = ['ff6f00', '00acc1', '7cb342', '84ffff', 'ffd600',  '7b1fa2', 'ffa726', '5c6bc0', 'c6ff00', '039be5', 'd50000', '81d4fa', '64dd17', '6200ea', 'c51162', 'ff7043', 'ffea00', '4db6ac', 'f06292', 'cfd8dc'];
//array stores tags that tell user what materials are currently appearing on the map
let tagsArray = [];

initMap();

//when a material is selected from one of dropdown lists, either map will populate with colored markers or user will receive notification via toast
$('.categories').on('click', 'li', function(event) {
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
  } else if (selectedMaterial === 'bulbs') {
    const $toastContent = $(`<span>See <a href="http://www.lightrecycle.org/collection-site-locator/" target="_blank">LightRecycle Washington</a> for mapped recycling options.</span>`);
    Materialize.toast($toastContent, 4000, 'rounded');
  //otherwise, use api call against county data to map options
  } else {
    const material = nameMatches[selectedMaterial];
    getResults(selectedMaterial, material);
  }
});

//when a tag is closed, markers of corresponding color will be taken off map
$('.chips').on('chip.delete', function(e, chip) {
  const closedMarker = chip.tag;
  deletePins(closedMarker);
  deleteTag(closedMarker);
});

$('.clear').on('click', function() {
  markers = [];
  tagsArray = [];
  searchID = -1;
});

//initialize Google map
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

//get results from King County recycling data
function getResults(selectedMaterial, material) {
  $.ajax({
    url: `https://data.kingcounty.gov/resource/tzui-ygc5.json?city=Seattle&material_handled=${material}`,
    dataType: 'json'
  }).done(function(data) {
    createMarkers(data, selectedMaterial);
    addTags(selectedMaterial);
  }).fail(function() {
    alert("There was an error. Please search again.");
  });
}

function createMarkers(data, selectedMaterial) {
  if (isNewSelection(selectedMaterial)) {
    updateSearchID();
    createMarkersFor(data, selectedMaterial, bounds, function(){
      map.fitBounds(bounds);
    });
  } else {
    const $toastContent = $(`<span>Places you can take <strong>${selectedMaterial}</strong> are already on the map.</span>`);
    Materialize.toast($toastContent, 4000, 'rounded');
  }
}

function createMarkersFor(data, selectedMaterial, bounds, cb){
  let returnedAsync = 0;

  for (let i = 0; i < data.length; i++) {
    createMarkerPosition(data, selectedMaterial, i, function(position){
      const title = data[i].provider_name;
      const address = data[i].geolocation_address;
      const city = data[i].mapping_location_city;
      const zip = data[i].geolocation_zip;
      const phone = data[i].phone;
      const url = data[i].provider_url;
      const hours = data[i].hours;
      let restrictions;
      if (data[i].restrictions === undefined) {
        restrictions = "See the website for possible restrictions.";
      } else {
        restrictions = data[i].restrictions
      }
      let description;
      if (data[i].service_description === undefined) {
        description = "Check out the website for details.";
      } else {
        description = data[i].service_description;
      }
      const marker = new google.maps.Marker({
        map: map,
        position: position,
        title: title,
        animation: google.maps.Animation.DROP,
        icon: makeMarkerIcon(iconColors[searchID]),
        material: selectedMaterial,
        address: address,
        city: city,
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

//if a service provider does not have coordinates entered in data, use geocoding to get them
function getCoordinates(address, cb) {
  $.ajax({
    url: `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=AIzaSyAynp8pr3LY7S2x60jYQ5DXaJz_sMwIhho`
  }).done(function(address) {
    return cb(createPosition(address));
  }).fail(function() {
    alert("There was an error. Please search again.");
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
  const provider = marker.title;
  if (infoWindow.marker != marker) {
    infoWindow.marker = marker;
    infoWindow.setContent(`
      <div class="infoWindowHeader"><a href="#">${provider}</a></div>
      <div id="col">
        <p>${marker.address}
        <br>${marker.city}, WA ${marker.zip}
        <br>${marker.phone}
        </p>
        <p><br>Open ${marker.hours}</p>
        <a href="${marker.url}">${marker.url}</a>
      </div>
      <hr>
      <div>
        <p>${marker.description}</p>
        <p>${marker.restrictions}</p>
        <div class="center-align">
          <a class="get-full-list waves-effect waves-light btn cyan darken-3">Full list of accepted materials</a>
        </div>
      </div>
      `);
    infoWindow.open(map, marker);
    infoWindow.addListener('closeclick', function() {
      infoWindow.close();
    });
    $('.get-full-list').on('click', function() {
      getListofServices(provider)
    });
  }
}

function getListofServices(provider) {
  provider = provider.replace(/&/, '%26');
  $.ajax({
    url: `https://data.kingcounty.gov/resource/tzui-ygc5.json?provider_name=${provider}`,
    dataType: 'json'
  }).done(function(provider_data) {
    displayListofServices(provider_data)
  }).fail(function() {
    alert(`There was an error with ${getListofServices}. Please search again.`);
  });
}

function displayListofServices(provider_data) {
  $('.full-list').empty();

  const $organization = $('<h5>').text(`${provider_data[0].provider_name}`);
  const $intro = $('<p>').text(`${provider_data[0].provider_name} accepts the following materials:`);
  const $list = $('<ul>').addClass('.browser-default');

  for (let i = 0; i < provider_data.length; i++) {
    const $item = $('<li>').text(`${provider_data[i].material_handled}`);
    $list.append($item);
  }

  $('.full-list').append($organization);
  $intro.insertAfter($organization);
  $list.insertAfter($intro);
  window.scrollTo(0, document.body.scrollHeight || document.documentElement.scrollHeight);

}


function isNewSelection(selectedMaterial) {
  let tagIsNew = true;

  for (let i = 0; i < tagsArray.length; i++) {
    if (tagsArray[i].tag === selectedMaterial) {
      tagIsNew = false
    }
  }
  return tagIsNew;
}

function updateSearchID() {
  if (searchID < 19) {
    searchID++;
  } else {
    searchID = 0;
  }
}

function addTags(selectedMaterial) {
  if (isNewSelection(selectedMaterial)) {
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

function deletePins(markersToDelete) {
  for (const marker of markers) {
    if (marker.material === markersToDelete) {
      marker.setMap(null);
    }
  }
}

function deleteTag(closedMarker) {
  for (let i = 0; i < tagsArray.length; i++) {
    if (tagsArray[i].tag === closedMarker) {
      tagsArray.splice(i, 1);
    }
  }
}

//special case for mattresses, since only location is in Tacoma and API query is otherwise for Seattle
function createMattressMarkers() {
  if (isNewSelection('mattresses')) {
    //check to see whether a new color remains to add to array
    updateSearchID()

    const marker = new google.maps.Marker({
      map: map,
      position: {lat: 47.240616, lng: -122.4327794},
      title: 'Spring Back Mattress Recycling NW',
      animation: google.maps.Animation.DROP,
      icon: makeMarkerIcon(iconColors[searchID]),
      material: 'mattresses',
      address: '117 Puyallup Ave',
      city: 'Tacoma',
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
  } else {
    const $toastContent = $(`<span>Places you can take <strong>mattresses</strong> are already on the map.</span>`);
    Materialize.toast($toastContent, 4000, 'rounded');
  }
}
