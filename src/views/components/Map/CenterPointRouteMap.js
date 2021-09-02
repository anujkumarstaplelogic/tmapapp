import React, { Component } from 'react';
import { View, Text,TextInput, Image,ScrollView, SafeAreaView, NetInfo, StyleSheet,Linking,Dimensions,TouchableOpacity,FlatList,ImageBackground,Modal,Animated,TouchableHighlight } from 'react-native';
import { Picker,Container,Content,Icon,Button } from 'native-base';
import { _storeData,_retrieveData,_showErrorMessage,_showSuccessMessage,Loader } from 'assets';
import { get_rescue_last_load,save_rescue_pickup_location } from 'api';
import { AsyncStorage } from 'react-native';
import CustomHeader from '../../CustomHeader';
import MapView, { Marker, AnimatedRegion,PROVIDER_GOOGLE,Polyline,Polygon } from "react-native-maps";
import Geolocation from 'react-native-geolocation-service';
import getDirections from 'react-native-google-maps-directions' 
import 'react-native-gesture-handler';
import { StackActions } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { CommonActions } from '@react-navigation/native';
const { width, height } = Dimensions.get('window'); 
const ASPECT_RATIO = width / height;
 

const GOOGLE_MAPS_APIKEY = 'AIzaSyAeewuHY56656dfgdfNVFoWyhNTo';
const WAYPOINT_LIMIT = 10;

class CenterPointRouteMap extends Component { 
  constructor(props){
    super(props);    
  
    this.state = {
      maplatitude: null,
      maplongitude: null,
      origin:null, 
      destination:null,
      LATITUDE_DELTA : 0.1,
      LONGITUDE_DELTA : 0.1 * ASPECT_RATIO,
      stops:[],
      routeCoordinate:[],
      station_name:'',
      station_latitude:'',
      station_longitude:'',
      isloading:false,
      bottomMargin:null,
      totaltime:'',
      totaldistance:'',
      polygonpoint:[],
      deliverystartlat:'',
      deliverystartlon:'',
      date:'',
    }
    
}

componentDidMount = () => { 
	this.setState({isloading:true}); 
	get_rescue_last_load().then(res => {
    console.log(res.data.LastDeliveryStops);
		if(res.type == 1){
			this.setState({date:res.data.date});
			var stops = []; 
      var polygonpoints = []; 
			
			   var count = 0;

			   for (const key of res.data.LastDeliveryStops) {

	        if(count != 0){
	          stops.push({latitude:key.latitude,longitude:key.longitude})
	        }

	        count++ 
	     }

        for (const key of res.data.RoutingPackages) {
          
            polygonpoints.push({latitude:key.latitude,longitude:key.longitude})
          }


	     this.setState({stops:stops,polygonpoint:polygonpoints,deliverystartlat:polygonpoints[0].latitude,deliverystartlon:polygonpoints[0].longitude});
       
	     let startlatitude = '';
	     let startlongitude = '';
	     Geolocation.getCurrentPosition((position) => {

          startlatitude = position.coords.latitude;
          startlongitude = position.coords.longitude;
        

            this.getCenterPoint(startlatitude,startlongitude);
            // this.getCenterPoint(43.662138,-79.368334);


            },
            (error) => {
              this.setLocationStatus(error.message+" Please try again");
            },
            {
        enableHighAccuracy: false,
        timeout: 15000
      });
		 
		}
    else{
      this.setState({isloading:false}); 
      _showErrorMessage(res.message);
    }

	})

  }

async getCenterPoint (startlatitude,startlongitude){

if(startlatitude && startlongitude){

	var distance = [];
	for (const key of this.state.stops) {

		await fetch("https://route.ls.hereapi.com/routing/7.2/calculateroute.json?apiKey=AIzaSyAeewuHY56656dfgdfNVFoWyhNTo&mode=fastest;car&waypoint0="+startlatitude+","+startlongitude+"&waypoint1="+key.latitude+","+key.longitude+"&height=5",{
	    method: 'GET',
	    headers: {
	      'Accept': 'application/json',
	    }       
	  })
	  .then((response) => response.json())
	  .then((res) => {
	  	if(res.response != undefined){

	  		distance.push({lat:key.latitude,lng:key.longitude,dist:res.response.route[0].summary.distance});
	  	}
	  	else{
        
	  		this.setState({isloading:false}); 
	  		_showErrorMessage('Wrong Address Found');
	  	}

	  })
	}

if(distance.length > 0){
	this.getNearByPoint(distance,startlatitude,startlongitude);

}
else{
  
	this.setState({isloading:false}); 
	_showErrorMessage('No distance found');
}

}
else{
	this.setState({isloading:false}); 
	_showErrorMessage('Location not found');
}



}

async getNearByPoint(distanceObj,startlatitude,startlongitude){

	var center = distanceObj.sort(function (a, b) {
    return a.dist - b.dist
 })

var center_lat  = center[0].lat;
var center_lng  = center[0].lng;
var place_url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?key=AIzaSyD77xQgaxmXZuBCzVkgTEA0sJytAyYVU2k&location='+center_lat+','+center_lng+'&fields=formatted_address,geometry&radius=3500&type=gas_station';
await fetch(place_url,{
	    method: 'GET',
	    headers: {
	      'Accept': 'application/json',
	    }       
	  })
	  .then((response) => response.json())
	  .then((res) => {
	  	
	  	if(res.status == "OK" && res.results.length > 0){

	  		var gas_station_lat = res.results[0].geometry.location.lat;
	  		var gas_station_lng = res.results[0].geometry.location.lng;
	  		var gas_station_name = res.results[0].name; 
	  		var origin= {"latitude": startlatitude, "longitude": startlongitude};
	  		var waypoint= [{"latitude": gas_station_lat, "longitude": gas_station_lng}];
        var destination= {"latitude": this.state.deliverystartlat, "longitude": this.state.deliverystartlon};
	  		this.setState({maplatitude:startlatitude,maplongitude:startlongitude,origin:origin,destination:destination,station_name:gas_station_name,station_latitude:gas_station_lat,station_longitude:gas_station_lng})
				
				 this.fetchAndRenderRoute(origin,destination,waypoint,waypoint);

				 this.setState({isloading:false}); 

	  	} 
	  	else{
	  		this.setState({isloading:false}); 
	  		_showErrorMessage('No gas station found');
	  	}

	  })
}


  decode(t) {
    let points = [];
    for (let step of t) {
      let encoded = step.polyline.points;
      let index = 0, len = encoded.length;
      let lat = 0, lng = 0;
      while (index < len) {
        let b, shift = 0, result = 0;
        do {
          b = encoded.charAt(index++).charCodeAt(0) - 63;
          result |= (b & 0x1f) << shift;
          shift += 5;
        } while (b >= 0x20);

        let dlat = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
        lat += dlat;
        shift = 0;
        result = 0;
        do {
          b = encoded.charAt(index++).charCodeAt(0) - 63;
          result |= (b & 0x1f) << shift;
          shift += 5;
        } while (b >= 0x20);
        let dlng = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
        lng += dlng;

        points.push({ latitude: (lat / 1E5), longitude: (lng / 1E5) });
      }
    }
    return points;
  }

  fetchAndRenderRoute = (origin,destination,waypoints,initialWaypoints) => {

    // let 
    
    var initialOrigin = origin;
    var initialDestination = destination;
    var directionsServiceBaseUrl = 'https://maps.googleapis.com/maps/api/directions/json';
    var mode = 'DRIVING';
    var language = 'en';
    var precision = 'low';
    var timePrecision = 'none';
    var language = 'en';
    var splitWaypoints = true;
    var optimizeWaypoints = false;

    var region;
    var apikey = GOOGLE_MAPS_APIKEY;
    var channel;
    
     
      

    if (!apikey) {
      console.warn(`MapViewDirections Error: Missing API Key`); // eslint-disable-line no-console
      return;
    }

    if (!initialOrigin || !initialDestination) {
      return;
    }

    const timePrecisionString = timePrecision==='none' ? '' : timePrecision;
    

    const routes = [];


    if (splitWaypoints && initialWaypoints && initialWaypoints.length > WAYPOINT_LIMIT) {
      // Split up waypoints in chunks with chunksize WAYPOINT_LIMIT
      const chunckedWaypoints = initialWaypoints.reduce((accumulator, waypoint, index) => {
        const numChunk = Math.floor(index / WAYPOINT_LIMIT); 
        accumulator[numChunk] = [].concat((accumulator[numChunk] || []), waypoint); 
        return accumulator;
      }, []);

      for (let i = 0; i < chunckedWaypoints.length; i++) {
        routes.push({
          waypoints: chunckedWaypoints[i],
          origin: (i === 0) ? initialOrigin : chunckedWaypoints[i-1][chunckedWaypoints[i-1].length - 1],
          destination: (i === chunckedWaypoints.length - 1) ? initialDestination : chunckedWaypoints[i+1][0],
        });
      }
    }
    

    else {
      routes.push({
        waypoints: initialWaypoints,
        origin: initialOrigin,
        destination: initialDestination,
      });
    }

    // Perform a Directions API Request for each route
    Promise.all(routes.map((route, index) => {
      let {
        origin,
        destination,
        waypoints,
      } = route;

      if (origin.latitude && origin.longitude) {
        origin = `${origin.latitude},${origin.longitude}`;
      }

      if (destination.latitude && destination.longitude) {
        destination = `${destination.latitude},${destination.longitude}`;
      }

      waypoints = waypoints
        .map(waypoint => (waypoint.latitude && waypoint.longitude) ? `${waypoint.latitude},${waypoint.longitude}` : waypoint)
        .join('|');

      if (optimizeWaypoints) {
        waypoints = `optimize:true|${waypoints}`;
      }

      return (
        this.fetchRoute(directionsServiceBaseUrl, origin, waypoints, destination, apikey, mode, language, region, precision, timePrecisionString, channel)
          .then(result => {
            return result;
          })
          .catch(errorMessage => {
            return Promise.reject(errorMessage);
          })
      );
    })).then(results => {
      // Combine all Directions API Request results into one
      const result = results.reduce((acc, { distance, duration, coordinates, fare, waypointOrder }) => {
        acc.coordinates = [
          ...acc.coordinates,
          ...coordinates,
        ];
        acc.distance += distance;
        acc.duration += duration;
        acc.fares = [
          ...acc.fares,
          fare,
        ];
        acc.waypointOrder = [
          ...acc.waypointOrder,
          waypointOrder,
        ];
        	// console.log(acc);
        return acc;
      }, {
        coordinates: [],
        distance: 0,
        duration: 0,
        fares: [],
        waypointOrder: [],
      });
      
      //saveData
      var distance = parseFloat(result.distance).toFixed(2)+' KM';
      var time  = this.timeConvert(Math.round(result.duration));

      // Plot it out and call the onReady callback
      this.setState({
        routeCoordinate: result.coordinates,
        totaltime:time,
				totaldistance:distance
      }, function(d) {
      	
        // if (onReady) {
        //   onReady(result);
        // }
      });
      this.saveData(distance,time);
    })
      .catch(errorMessage => {
        this.resetState();
        console.warn(`MapViewDirections Error: ${errorMessage}`); // eslint-disable-line no-console
        // onError && onError(errorMessage);
      });
  }

  saveData(distance,time){
		this.setState({isloading:false});
		let data =  {total_distance:distance,total_time:time,current_lat:this.state.maplatitude,current_long:this.state.maplongitude,pickup_location_address:this.state.station_name,pickup_location_lat:this.state.station_latitude,pickup_location_long:this.state.station_longitude}
    console.log(data);
		save_rescue_pickup_location(data).then(res => {
			this.setState({isloading:false});
		if(res.type == 1){
			_showSuccessMessage(res.message);
		}
		else{
			_showErrorMessage(res.message) 
		}
		})

	}

  fetchRoute(directionsServiceBaseUrl, origin, waypoints, destination, apikey, mode, language, region, precision, timePrecision, channel) {

    // Define the URL to call. Only add default parameters to the URL if it's a string.
    let url = directionsServiceBaseUrl;
    if (typeof (directionsServiceBaseUrl) === 'string') {
      url += `?origin=${origin}&waypoints=${waypoints}&destination=${destination}&key=${apikey}&mode=${mode.toLowerCase()}&language=${language}&region=${region}`;
      if(timePrecision){
        url+=`&departure_time=${timePrecision}`;
      }
      if(channel){
        url+=`&channel=${channel}`;
      }
    }

    return fetch(url)
      .then(response => response.json())
      .then(json => {

        if (json.status !== 'OK') {
          const errorMessage = json.error_message || json.status || 'Unknown error';
          return Promise.reject(errorMessage);
        }

        if (json.routes.length) {

          const route = json.routes[0];

          return Promise.resolve({
            distance: route.legs.reduce((carry, curr) => {
              return carry + curr.distance.value;
            }, 0) / 1000,
            duration: route.legs.reduce((carry, curr) => {
              return carry + (curr.duration_in_traffic ? curr.duration_in_traffic.value : curr.duration.value);
            }, 0) / 60,
            coordinates: (
              (precision === 'low') ?
                this.decode([{polyline: route.overview_polyline}]) :
                route.legs.reduce((carry, curr) => {
                  return [
                    ...carry,
                    ...this.decode(curr.steps),
                  ];
                }, [])
            ),
            fare: route.fare,
            waypointOrder: route.waypoint_order,
          });

        } else {
          return Promise.reject();
        }
      })
      .catch(err => {
        return Promise.reject(`Error on GMAPS route request: ${err}`);
      });
  }



timeConvert(n) {
var num = n;

var minutes = n;
var hours = (minutes / 60);
var rminutes = Math.floor(minutes);
var rhours = Math.floor(hours);
var minutes2 = (hours - rhours) * 60;
// console.log(minutes2,minutes);

return rhours + " HRS " + Math.floor(minutes2) + " MIN";
}

gotolocation(){
  _storeData('LoadSecreen','MAP').then();
   this.props.navigation.dispatch(StackActions.replace('Dashboard'));


}

render() {
    // alert();
    return (
    <Container>
        <Content>
        <CustomHeader {...this.props} url={this.state.user_avtar} />
          <View style={{flexDirection: 'row',alignItems:'center',justifyContent: 'space-between',borderColor: '#00c2f3',borderWidth: 1,backgroundColor: '#00c2f3',marginTop: '4%'}}>
            <TouchableOpacity style={{flexDirection: 'row',
		alignItems:'center',
		justifyContent: 'space-between'}} onPress={() => this.props.navigation.navigate('Route')}>
              <Icon type="FontAwesome" name='angle-left' style={{color: '#fff',
		fontWeight: '100',
		padding:10}}/>
              <Text style={{color:"#fff",fontWeight:'bold',marginTop:(Platform.OS == 'ios') ? 5 : 0, fontSize: 22,padding:10,textAlign:'center',paddingLeft:'4%'}}>TODAY:</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => this.refreshPage()}>
            	<Text style={{color:"#fff",fontWeight:'bold', fontSize: 22}}>{this.state.date}</Text>
          </TouchableOpacity>
        </View>
        
        <View style={{height: 5}}></View>	
    		<View style={styles.container}>
    		<View style={{padding:10,backgroundColor:"#e5f8fd"}}>

	      		<View style={{flexDirection:'row', width:"100%",paddingBottom:10}}>
		        	<View style={{flexDirection:'row', width:"100%"}}>
		          		<Text style={{marginLeft:15,fontSize:18,fontWeight:"bold",color:"#000"}}>Gas Station</Text>
		          		
		        	</View>
		       	 </View>
		        <View style={{flexDirection:'row', width:"100%",paddingBottom:10}}>
		        	<View style={{flexDirection:'row', width:"100%"}}>
		          		<Text style={{marginLeft:15,fontSize:15,color:"#000"}}>{this.state.station_name}</Text>
		        	</View>
		        </View>
		        <View style={{flexDirection:'row', width:"100%",paddingTop:10,borderColor:"#ccc",borderTopWidth:1}}>
		        	<View style={{flexDirection:'row', width:"50%"}}>
		          		<Text style={{marginLeft:15,fontSize:12,color:"#000"}}><Text style={{fontWeight:"bold"}}>Total Distance:</Text> {this.state.totaldistance}</Text>
		        	</View>
		        	<View style={{flexDirection:'row', width:"50%"}}>
		          		<Text style={{marginLeft:15,fontSize:12,color:"#000"}}><Text style={{fontWeight:"bold"}}>Travel Time:</Text> {this.state.totaltime}</Text>	
		        	</View>
		        </View>
		        
	        </View>
		      <View style={{ width: '100%',height:250, flexDirection:'row',marginTop:5}}>
		      {this.state.maplatitude && this.state.maplongitude ? (
		        <MapView 
		            
		            ref={(ref) => { this.map = ref }} 
		            initialRegion={{
		              latitude: this.state.maplatitude,
		              longitude: this.state.maplongitude,
		              latitudeDelta: 0.000001,
		              longitudeDelta: this.state.LONGITUDE_DELTA,
		            }}
		            mapPadding={{
		                        top: 20,
		                        right: 20,
		                        bottom: 20,
		                        left: 20
		                    }}
		                    
		            loadingEnabled={false}
		            userLocationPriority={'high'}
		            followsUserLocation={true}
		            showsUserLocation={true}
		            showsMyLocationButton={true}
		            showsTraffic={false}
		            zoomEnabled={true}
		            zoomTapEnabled={true}
		            zoomControlEnabled={true}
		            rotateEnabled={true}
		            scrollEnabled={true}
		            toolbarEnabled={true}
		            showsCompass={false}
		            userInterfaceStyle={'dark'}
		             
		          style={{
		            marginBottom: this.state.bottomMargin,            
		            ...StyleSheet.absoluteFillObject,
		          }}
		         
		          mapType={Platform.OS == "android" ? "standard" : "standard"}
		          onLayout = { (some) => {

		          }}
		         onMapReady={() => this.setState({ bottomMargin: 1 })}
		            >
		            <MapView.Marker key={1} pinColor="green" coordinate={{latitude:this.state.origin.latitude,longitude:this.state.origin.longitude}}>
			          	<View><Image source={require('../../../assets/images/startflag.png')}  />
                </View>

          			</MapView.Marker>

          			<MapView.Marker key={2} pinColor="green" coordinate={{latitude:this.state.destination.latitude,longitude:this.state.destination.longitude}}>
			          	<View><Image source={require('../../../assets/images/lastflag.png')}  />
                </View>

          			</MapView.Marker>
                <MapView.Marker key={3} pinColor="green" coordinate={{latitude:this.state.station_latitude,longitude:this.state.station_longitude}}>
                  <View>
                  <ImageBackground source={require('../../../assets/images/pending.png')} style={styles.imagemarker}>
                  <Text style={{textAlign: "center",color:"#000",fontWeight:'bold',marginBottom: 22}}>R</Text>
                  </ImageBackground>
                </View>

                </MapView.Marker>

		            <Polyline
          coordinates={this.state.routeCoordinate}
          strokeColor="#d66100" // fallback for when `strokeColors` is not supported by the map-provider
          strokeColors={[
            '#7F0000',
            '#00000000', // no color, creates a "long" gradient between the previous and next coordinate
            '#B24112',
            '#E5845C',
            '#238C23',
            '#7F0000'
          ]}
          strokeWidth={6}
        />

         <Polygon
        coordinates={this.state.polygonpoint}
        strokeColor="green" // fallback for when `strokeColors` is not supported by the map-provider
        strokeColors={[
            '#7F0000',
            '#00000000', // no color, creates a "long" gradient between the previous and next coordinate
            '#B24112',
            '#E5845C',
            '#238C23',
            '#7F0000'
        ]}
        fillColor="rgba(0, 200, 0, 0.5)" 
        strokeWidth={3}
        
    />
		           
		      </MapView>) :( 

		      <Text> Loading
		        </Text>)
		        }
		        
		     </View>
		    
           <View style={{ flexDirection: 'row',flex:1,alignSelf:'center',zIndex: -1, elevation: -1}}>
            <Button style={{ height: 35, width:'95%',marginTop: 20,marginBottom:10, backgroundColor: '#00c2f3', justifyContent: 'center',}}
                  onPress={() => this.gotolocation()} >
                  <Text style={{ textAlign: 'center', color: '#fff', fontSize: 22 }}>GO TO START LOCATION</Text>
            </Button>
          </View>
		     </View>
		      {this.state.isloading && (
              <Loader />
          )}
     	</Content>
     </Container>
     )
  }
}

const styles = StyleSheet.create({
   buttonlogout:{
    marginTop:20,
  },
   centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 0,
    backgroundColor:"#1c1e2136",

  },
  modalView: {
  margin: 20,
  backgroundColor: "white",
  borderRadius: 20,
  padding: 35,
  alignItems: "center",
  shadowColor: "#000",
  shadowOffset: {
    width: 5,
    height: 2
  },

},
  
  welcome: {
    fontSize: 20,  
    textAlign: 'left',
    margin: 10,
    paddingTop:40,
    color:"#000"

  },
  imagemarker:{
    width:40,
    height:60,
    justifyContent: "center"
  }
}); 

export default CenterPointRouteMap;