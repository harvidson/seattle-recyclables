const $script = $('<script>');
$script.attr('src', `https://maps.googleapis.com/maps/api/js?key=${googleMapsAPI}&callback=initMap`).attr('async');
$('body').append($script);

let markers = [];
let map;

function initMap() {
  const seattle = {
    lat: 47.620828,
    lng: -122.332982
  };
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: seattle
  });

  $('#computers').click(function(e){
    createComputerMarkers();
  });


}

function createComputerMarkers(){


  const marker = new google.maps.Marker({
    position: {
      lat: 47.620830,
      lng: -122.332990
    },
    map: map
  });
  markers.push(marker);
}

//this thing has to be disassembled and put into mapInit
function createMarkers() {
  const infoWindow = new google.maps.InfoWindow({});

  // establishes map boundaries
  let bounds = new google.maps.LatLngBounds();

  //call getResults

  // mock-up--loops through sample locations, adding a marker object to markers for each one

  for (let i = 0; i < threadcycle.length; i++) {
    const position = threadcycle[i].location;
    const title = threadcycle[i].title;
    const marker = new google.maps.Marker({
      map: map,
      position: position,
      title: title,
      animation: google.maps.Animation.DROP,
      id: i
    });
    markers.push(marker);
    // adjust map scope to fit the marker
    bounds.extend(marker.position);
    // listen for click event on earch marker
    marker.addListener('click', function() {
      populateInfoWindow(this, infoWindow);
    });
    // give location details in an infoWindow for selected marker
    function populateInfoWindow(marker, infoWindow) {
      if (infoWindow.marker != marker) {
        infoWindow.marker = marker;
        infoWindow.setContent(`<div>${marker.title}</div>`);
        infoWindow.open(map, marker);
        infoWindow.addListener('closeclick', function() {
          //weird bug here--if you close the infoWindow you can't immediately click on it again to reopen
          infoWindow.close();
        });
      }
    }
  }
  map.fitBounds(bounds);
}

function adjustBounds() {

}

function addInfoWindows() {

}

// add event listeners to all the materials

$('.categories').on('click', 'li', function(event) {
  // console.log($(this).attr('id'));

  const selectedMaterial = $(this).attr('id');
  //if id=threadcycle, use hardcoded array as data source to map options
  if (selectedMaterial === 'threadcycle') {
    // threadcycle();
    console.log("you picked threadcycle; you should get a toast telling you more about this program");
    //if id=garbage, use a toast to notify
  } else if (selectedMaterial === 'garbage') {
    console.log("you'll get a toast telling you to throw that stuff in garbage");
    //otherwise, use api call against county data to map options
  } else {
    getMaterialHandled(selectedMaterial);
  }
});

// change id of selected item into a string that matches material_handled in county json
function getMaterialHandled(selectedMaterial) {
  console.log(nameMatches[selectedMaterial]);
  let materialHandled = nameMatches[selectedMaterial];
  getResults(materialHandled);
}

function getResults(materialHandled) {
  $.ajax({
    url: `https://data.kingcounty.gov/resource/tzui-ygc5.json?city=Seattle&material_handled=${materialHandled}`,
    dataType: 'json',
  }).done(function(data) {
    console.log(data);
    return data;
  }).fail(function() {
    alert("There was an error. Please search again.")
  });
}

//generate map markers from threadcycle object
// function threadcycle() {
//
// }
