let markers = [];

function initMap() {
     const seattle = {lat: 47.620828, lng: -122.332982};
     const map = new google.maps.Map(document.getElementById('map'), {
       zoom: 12,
       center: seattle
     });


     const infoWindow = new google.maps.InfoWindow({

     });
// establishes map boundaries
     let bounds = new google.maps.LatLngBounds();

// sample set of locations to mark
   const threadcycleGoodwill = [
    //  {title: '', location: {lat: , lng: }, address: ''},
    {title: 'Goodwill Northgate', location: {lat: 47.704994, lng: -122.323118}, address: `10685 5th Ave NE, Seattle, WA, 98125`},
    {title: 'Goodwill Greenwood', location: {lat: 47.701921, lng: -122.361035}, address: `10022 Holman Rd. NW, Seattle, WA, 98177`}
   ]

// loops through sample locations, adding a marker object to markers for each one
   for (let i = 0; i < threadcycleGoodwill.length; i++) {
     const position = threadcycleGoodwill[i].location;
     const title = threadcycleGoodwill[i].title;
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
     })
// give location details in an infoWindow for selected marker
     function populateInfoWindow(marker, infoWindow) {
       if (infoWindow.marker != marker) {
         infoWindow.marker = marker;
         infoWindow.setContent(`<div>${marker.title}</div>`);
         infoWindow.open(map, marker);
         infoWindow.addListener('closeclick', function() {
           infoWindow.setMarker(null);
         });
       }
     }
   }
   map.fitBounds(bounds);
}

// add event listeners to all the materials
$('.categories').on('click', 'li', function(event) {
  // console.log($(this).attr('id'));
  const selectedMaterial = $(this).attr('id');
  getMaterialHandled(selectedMaterial);
});

function getMaterialHandled(selectedMaterial) {
  let materialHandled = 'Paint';
  getResults(materialHandled);
}

function getResults(materialHandled) {
  $.ajax( {
    url: `https://data.kingcounty.gov/resource/tzui-ygc5.json?city=Seattle&material_handled=${materialHandled}`,
    dataType: 'json',
  } ).done(function(data) {
    console.log(data);
  })
}

// converts id of selected item into a string that matches material_handled in county json



//use an object to run through different options re. what got clicked?
