const $ = (q) => document.querySelector(q);
const $$ = (qq) => Array.from(document.querySelectorAll(qq));


const hereCredentials = {
   id: 'rQV9iH0dFclorKNdx0nl',
   code: 'Zml0JUDp0WXJXgxY7VFqAQ'
}

const hereTiles = L.tileLayer(`https://2.base.maps.api.here.com/maptile/2.1/maptile/newest/reduced.night/{z}/{x}/{y}/512/png8?app_id=${hereCredentials.id}&app_code=${hereCredentials.code}&ppi=320`);


const map = L.map('map', {
   center: [47.608013, -122.335167],
   zoom: 11,
   layers: [hereTiles],
   zoomControl: false
});

function makeAutoGeoCodeUrl(query) {
   return `http://autocomplete.geocoder.api.here.com/6.2/suggest.json?app_id=${hereCredentials.id}&app_code=${hereCredentials.code}&query=${query}&beginHighlight=<b>&endHighlight=</b>     `
}

Object.assign(String.prototype, {
   makeGeoCodeUrl() {
      return `https://geocoder.api.here.com/6.2/geocode.json?app_id=${hereCredentials.id}&app_code=${hereCredentials.code}&searchtext=${this}`
   }


});

function makeWaypointSequenceUrl(rawDestinations) {
   const start = `start=${rawDestinations[0].Latitude},${rawDestinations[0].Longitude}`;
   let destinations = '';
   for (let i = 1; i < rawDestinations.length; i++) {
      destinations += `&destination${i}=${rawDestinations[i].Latitude},${rawDestinations[i].Longitude}`
   }
   return `https://wse.api.here.com/2/findsequence.json?${start}${destinations}&improveFor=time&mode=fastest%3Bcar&app_id=${hereCredentials.id}&app_code=${hereCredentials.code}`
}

function makeRoutingUrl(rawDestinations) {
   let destinations = '';
   for (let i = 0; i < rawDestinations.length; i++) {
      destinations += `&waypoint${i}=${rawDestinations[i].lat},${rawDestinations[i].lng}`
   }
   return `https://route.api.here.com/routing/7.2/calculateroute.json?$${destinations}&mode=fastest%3Bcar&app_id=${hereCredentials.id}&app_code=${hereCredentials.code}&routeattributes=shape`
}


$('#route').onclick = () => {
  $('lui-spinner').style.display = 'inline';
   const urls = $$('.destinput').map(x => x.value.makeGeoCodeUrl());
   console.log(urls);

   //Geocode the responses
   Promise.all(urls.map(url =>
      fetch(url).then(resp => resp.json())

   )).then(responses => {
      // console.log(responses)
      const coordinates = responses.map(x => x.Response.View[0].Result[0].Location.NavigationPosition[0]);
      const waypointReq =  makeWaypointSequenceUrl(coordinates);


      //Calculate Waypoint optimization
      fetch(waypointReq).then(res => res.json()).then(waypointRes => {
         const waypoints = waypointRes.results[0].waypoints;
         console.log(waypoints);
         const time = waypointRes.results[0].time;

         const routingReq = makeRoutingUrl(waypointRes.results[0].waypoints);

         //Routing Res
         fetch(routingReq).then(res => res.json()).then(routingRes => {
            console.log(routingRes)

            const shape = routingRes.response.route[0].shape;
            $('lui-spinner').style.display = 'none';
         })


      })
   })
}

let inputs = $$('.destinput');
// inputs.forEach((input) => {
//    input.oninput = () => {
//       const value = input.value.split(' ').join('+');
//       const id = input.id.split('-')[1]
//       fetch(makeAutoGeoCodeUrl(value)).then(res => res.json()).then(res => {
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
