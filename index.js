const $ = (q) => document.querySelector(q);
const $$ = (qq) => Array.from(document.querySelectorAll(qq));


const hereCredentials = {
   id: 'E2ZQ9D1JPucDy6AYr2LV',
   code: 'JSkKINQgwC1NazM236X9GQ'
}

const hereTileUrl = `https://2.base.maps.api.here.com/maptile/2.1/maptile/newest/reduced.night/{z}/{x}/{y}/512/png8?app_id=${hereCredentials.id}&app_code=${hereCredentials.code}&ppi=320`;
const examplePlaces = ['701 Pike St. Seattle', '954 E Union St. Seattle', '4703 21st Ave NE Seattle', '4699 SW Landert St. Seattle', '4825 27th Ave S Seattle']


const map = L.map('map', {
   center: [47.608013, -122.335167],
   zoom: 11,
   layers: [L.tileLayer(hereTileUrl)],
   zoomControl: false
});

let rowIndex = 0;

for (let i = 0; i < 3; i++) {
   makeInput(i)
}

function makeInput(index) {
   /*
   <div class="form-group">
      <p class="lui-body">Destination 1</p>
      <lui-textfield  class="lui-small" >
         <input id="input-1" class="destinput" value="Seattle, WA" name="my-text" type="text" value="test" list="list-1">
      </lui-textfield>
      <datalist id="list-1"></datalist>
   </div>
   */
   let examplePlace = examplePlaces[index];
   if (index >= examplePlaces.length) {
      examplePlace = '';
   }
   let title = `Destination ${index}`;
   if (index == 0) {
      title = 'Origin'
   }


   const formInput = document.createElement('div');
   formInput.classList.add('form-group');
   formInput.innerHTML = `
      <p class="lui-body form-title">${title}</p>
      <lui-textfield  class="lui-small" >
         <input id="input-${index}" class="destinput" value="${examplePlace}" name="my-text" type="text" value="test" list="list-${index}">
      </lui-textfield>
      <datalist id="list-${index}"></datalist>`
   rowIndex++;
   $('.inputs').appendChild(formInput)
}

Object.assign(String.prototype, {
   makeGeoCodeUrl() {
      return `https://geocoder.api.here.com/6.2/geocode.json?app_id=${hereCredentials.id}&app_code=${hereCredentials.code}&searchtext=${this}`
   },
   makeAutoGeoCodeUrl() {
      return `http://autocomplete.geocoder.api.here.com/6.2/suggest.json?app_id=${hereCredentials.id}&app_code=${hereCredentials.code}&query=${this}&beginHighlight=<b>&endHighlight=</b>     `
   }
});

Object.assign(Array.prototype, {
   makeWaypointSequenceUrl() {
      const start = `start=${this[0].Latitude},${this[0].Longitude}`;
      let destinations = '';
      for (let i = 1; i < this.length; i++) {
         destinations += `&destination${i}=${this[i].Latitude},${this[i].Longitude}`
      }
      return `https://wse.api.here.com/2/findsequence.json?${start}${destinations}&improveFor=time&mode=fastest%3Bcar&app_id=${hereCredentials.id}&app_code=${hereCredentials.code}`
   },
   makeRoutingUrl() {
      let destinations = '';
      for (let i = 0; i < this.length; i++) {
         destinations += `&waypoint${i}=${this[i].lat},${this[i].lng}`
      }
      return `https://route.api.here.com/routing/7.2/calculateroute.json?$${destinations}&mode=fastest%3Bcar&app_id=${hereCredentials.id}&app_code=${hereCredentials.code}&routeattributes=shape`
   }
});
$('#new-route').onclick = () => {
   makeInput(rowIndex)
}

$('#route').onclick = () => {

   clearMap();
   $('lui-spinner').style.display = 'inline';
   $('#route-info-container').innerHTML = '';

   const urls = $$('.destinput').map(x => x.value).filter(x => x != '').map(x => x.makeGeoCodeUrl());

   //Geocode the responses
   Promise.all(urls.map(url =>
      fetch(url).then(resp => resp.json())
   )).then(responses => {
      // console.log(responses)
      const coordinates = responses.map(x => x.Response.View[0].Result[0].Location.NavigationPosition[0]);
      const waypointReq =  coordinates.makeWaypointSequenceUrl();


      //Calculate Waypoint optimization
      fetch(waypointReq).then(res => res.json()).then(waypointRes => {
         const waypoints = waypointRes.results[0].waypoints;
         console.log(waypoints);
         const time = waypointRes.results[0].time;

         const routingReq = waypointRes.results[0].waypoints.makeRoutingUrl();

         //Routing Res
         fetch(routingReq).then(res => res.json()).then(routingRes => {
            console.log(routingRes)

            const shape = routingRes.response.route[0].shape.map(x => x.split(','));
            const polyline = L.polyline(shape, {color: '#2DD5C9'}).addTo(map).snakeIn();

            const routeWaypoints = routingRes.response.route[0].waypoint;

            console.log(routeWaypoints)
            console.log(routingRes.response.route[0])
            for (let i = 0; i < routeWaypoints.length; i++) {
               const loc = [routeWaypoints[i].mappedPosition.latitude, routeWaypoints[i].mappedPosition.longitude];
               const marker = L.marker(loc).addTo(map)

               const routeInfo = document.createElement('div');
               routeInfo.classList.add('lui-body')
               routeInfo.innerText = `Stop ${i}: ${routeWaypoints[i].label}`
               $('#route-info-container').appendChild(routeInfo)
            }



            $('lui-spinner').style.display = 'none';
         })


      })
   })
}

const inputs = $$('.destinput');
// inputs.forEach((input) => {
//    input.oninput = () => {
//       const value = input.value.split(' ').join('+');
//       const id = input.id.split('-')[1]
//       fetch(value.makeAutoGeoCodeUrl()).then(res => res.json()).then(res => {
//          const suggestions = res.suggestions;
//          console.log(suggestions)
//          input.parentNode.nextSibling.nextSibling.innerHTML = '';
//          for (let i = 0; i < suggestions.length; i++) {
//             const option = document.createElement('option');
//             option.innerText = suggestions[i].label;
//             input.parentNode.nextSibling.nextSibling.appendChild(option)
//
//          }
//          console.log(input.parentNode.nextSibling.nextSibling)
//       })
//    }
// })

function clearMap() {
   map.eachLayer((layer) => {
      if (!layer.hasOwnProperty('id') && layer._url != hereTileUrl) {
         map.removeLayer(layer);
      }
   });
}
