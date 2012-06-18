/*HTMLElement.prototype.originalRemoveEventListener
        = HTMLElement.prototype.removeEventListener;
 
HTMLElement.prototype.removeEventListener = function(type, listener, useCapture)
{
    console.log('remove: ' + type);
    this.originalRemoveEventListener(type, listener, useCapture);
};
*/

var markets = [];
var viewAssembler = new ViewAssembler();

$(document).ready( function(){
    loadTemplates( setupDefaultView );
} );

function setupDefaultView() { 
    
    var bodyView = viewAssembler.defaultView(); 
    
    //Setup the default view
    var defaultView = { title: "Welcome!", 
    view:  bodyView,
    };
    
    //Setup the ViewNavigator
    window.viewNavigator = new ViewNavigator( 'body' );	
    window.viewNavigator.pushView( defaultView );
    
	$.getScript("data.js", scriptSuccess);
}

function onMapButtonClick( event ) {
    var view = { title: "Map",
             backLabel: (isTablet() ? "Back" : " "),
             view: viewAssembler.mapView(),
             scroll:false
           };
    window.viewNavigator.pushView( view );
    event.stopPropagation();
    return false;
}


function onSearchResultMapButtonClick( event ) {
    
    var centerPoint = {x:0,y:0};
    var len = 0;
    
    for( var i = 0; i<window.filteredMarkesList.length; i++ ){
    
        var _x = parseFloat(window.filteredMarkesList[i].x);
        var _y = parseFloat(window.filteredMarkesList[i].y);
    
        if ( !isNaN( _x ) && !isNaN( _y ) ) {
            //console.log( i, len, _x, _y );
            centerPoint.x += _x;
            centerPoint.y += _y;
            len ++;
        }
    }
    //console.log( centerPoint.x, centerPoint.y );
    centerPoint.x = centerPoint.x / len;
    centerPoint.y = centerPoint.y / len;
    
    //console.log( centerPoint.x, centerPoint.y );
    centerPoint = new L.LatLng(centerPoint.y, centerPoint.x);

    var view = { title: "Map",
             backLabel: (isTablet() ? "Back" : " "),
             view: viewAssembler.mapView(centerPoint),
             scroll:false
           };
    window.viewNavigator.pushView( view );
    event.stopPropagation();
    return false;
}


function onAboutViewClick( event ) {
    var view = { title: "About",
             backLabel: (isTablet() ? "Back" : " "),
             view: viewAssembler.aboutView()
           };
    window.viewNavigator.pushView( view );
    event.stopPropagation();
    return false;
}

function onSearchViewClick( event ) {
    var view = { title: "List",
             backLabel: (isTablet() ? "Back" : " "),
             view: viewAssembler.searchView(),
           };
    window.viewNavigator.pushView( view );
    event.stopPropagation();
    return false;
}

function onNearbyViewClick( event ) {

    var view = { title: "Nearby",
             view: viewAssembler.findNearbyView()
           };
    window.viewNavigator.pushView( view );
    
    //acquire location
    navigator.geolocation.getCurrentPosition(onGeoSuccess, onGeoError, { maximumAge: 60000, timeout: 5000, enableHighAccuracy: true });
    event.stopPropagation();
    return false;
}

var onGeoSuccess = function(position) {
   /* console.log('Latitude: '          + position.coords.latitude          + '\n' +
          'Longitude: '         + position.coords.longitude         + '\n' +
          'Altitude: '          + position.coords.altitude          + '\n' +
          'Accuracy: '          + position.coords.accuracy          + '\n' +
          'Altitude Accuracy: ' + position.coords.altitudeAccuracy  + '\n' +
          'Heading: '           + position.coords.heading           + '\n' +
          'Speed: '             + position.coords.speed             + '\n' +
          'Timestamp: '         + new Date(position.timestamp)      + '\n');
     */
    var latitude = parseFloat( position.coords.latitude );
    var longitude = parseFloat( position.coords.longitude );
    
    //set a delay to allow transition to complete before requesting data
    setTimeout( function () {     
        var filtered = filterMarketsByGeo( latitude, longitude );
            
        var view = { title: "Nearby",
             backLabel: (isTablet() ? "Back" : " "),
             view: viewAssembler.findNearbyView()
           };
           
        view.view.children().remove();
        view.view.append( viewAssembler.nearbyMarketsView( latitude, longitude, filtered ) );
        window.viewNavigator.replaceView( view );
    }, 600 );
};

// onError Callback receives a PositionError object
//
function onGeoError(error) {
   /* alert('code: '    + error.code    + '\n' +
          'message: ' + error.message + '\n');
     */   
       
    //wait for transition complete
    setTimeout( function() {
        var view = { title: "Nearby",
                 backLabel: (isTablet() ? "Back" : " "),
                 view: viewAssembler.geoPermissionDenied()
               };
        window.viewNavigator.replaceView( view );
    }, 500);
}

//find the all markets within 100 miles
function filterMarketsByGeo( latitude, longitude ) {
    var result = [];
    var startTime = new Date().getTime();
    for ( var i =0; i < markets.length; i++ )
    {
        var lat1 = parseFloat(markets[i][9]);
        var lon1 = parseFloat(markets[i][8]);
        var lat2 = parseFloat(latitude);
        var lon2 = parseFloat(longitude);
        //console.log( lat1, lon1, lat2, lon2 );
        var d = distance( lat1, lon1, lat2, lon2 );
        if ( d < 100 ){
            result.push( markets[i] );
        }
        
    }
    //console.log( new Date().getTime() - startTime );
    return result;
}

function distance( lat1, lon1, lat2, lon2 ) {
    var R = 6371; // Radius of the earth in km
    var dLat = toRad(lat2-lat1);  // Javascript functions in radians
    var dLon = toRad(lon2-lon1); 
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2); 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = R * c; // Distance in km
    var m = 6 / 1.609344; // Distance in miles
    return d;
}

function toRad(degree) 
{
    rad = degree* Math.PI/ 180;
    return rad;
}


function scriptSuccess(data, textStatus, jqXHR) {
	
	for ( var i=0; i<markets.length; i++ ) {
	    markets[i].push( i.toString() );
	}
	//console.log( "scriptSuccess: " + markets.length );
}


function onNearbyListItemClick( event ) {
    
    $( "li" ).removeClass( "listSelected" );
    var target = $( event.target )
    if (target.get(0).nodeName.toUpperCase() != "LI") {
        target=target.parent();
    }
    
    target.addClass( "listSelected" );
    var index = target.attr( "index" );
    index = parseInt( index );
    showMarketDetails( markets[index] );
}

function showMarketDetailsFromMapClick( index ) {
    
    setTimeout( function() {
        showMarketDetails( markets[index] );
    }, 50 );
}
    
function showMarketDetails( item ) { 
    var market = arrayToMarketObject(item);
    var view = { title: "Market Detail",
             backLabel: (isTablet() ? "Back" : " "),
             view: viewAssembler.marketDetailsView( market )
           };
    window.viewNavigator.pushView( view );
}

function onSearchButtonClick( event ) {
    var criteria = {};
    
    var fields = ["state", "searchPhrase", 
                  "credit", "wiccash", "sfmnp", "snap",
                  "bakedGoods", "cheese", "crafts",
                  "flowers", "seafood", "fruit", "herbs", "vegetables", "honey", "jams", "maple",
                  "meat", "nuts", "plants", "soap"];
    
    for ( var index in fields ) {
        var field = fields[ index ];
        var $input = $("#search_" + field);
        var value;
        
        if ( index <= 1 ){
            value = $input.val();
            
            if ( value != undefined && value.length > 0 ) {
                criteria[field] = value;
            }
        }
        else {
            value = $input.is(":checked");
            if ( value == true ) {
                criteria[field] = value;
            }
        }
    }
    
    var markets = filterMarketsBySearchCriteria( criteria );
    var view = { title: "Search Results",
             backLabel: (isTablet() ? "Back" : " "),
             view: viewAssembler.searchResultsView( markets, criteria )
           };
    window.viewNavigator.pushView( view );
}


function filterMarketsBySearchCriteria( criteria ) {
    var result = [];
    var startTime = new Date().getTime();
    for ( var i =0; i < markets.length; i++ )
    {
        if ( marketRowMatchesCriteria( markets[i], criteria ) ) {
            result.push(  markets[i] );
        }
    }
    //console.log( new Date().getTime() - startTime );
    return result;
}

function marketRowMatchesCriteria( row, criteria ) {
    
    //state
    if ( row[6] != criteria.state ) { return false; }
                  
    if ( criteria.credit == true )      {    if ( row[11] != "Y" ) return false;    };
    if ( criteria.wic == true )         {    if ( row[12] != "Y" ) return false;    };
    if ( criteria.wiccash == true )     {    if ( row[13] != "Y" ) return false;    };
    if ( criteria.sfmnp == true )       {    if ( row[14] != "Y" ) return false;    };
    if ( criteria.snap == true )        {    if ( row[15] != "Y" ) return false;    };
    
    
    if ( criteria.bakedGoods == true )  {    if ( row[16] != "Y" ) return false;    };
    if ( criteria.cheese == true )      {    if ( row[17] != "Y" ) return false;    };
    if ( criteria.crafts == true )      {    if ( row[18] != "Y" ) return false;    };
    if ( criteria.flowers == true )     {    if ( row[19] != "Y" ) return false;    };
    if ( criteria.seafood == true )     {    if ( row[20] != "Y" ) return false;    };
    if ( criteria.fruit == true )       {    if ( row[21] != "Y" ) return false;    };
    if ( criteria.herbs == true )       {    if ( row[22] != "Y" ) return false;    };
    if ( criteria.vegetables == true )  {    if ( row[23] != "Y" ) return false;    };
    if ( criteria.honey == true )       {    if ( row[24] != "Y" ) return false;    };
    if ( criteria.jams == true )        {    if ( row[25] != "Y" ) return false;    };
    if ( criteria.maple == true )       {    if ( row[26] != "Y" ) return false;    };
    if ( criteria.meat == true )        {    if ( row[27] != "Y" ) return false;    };
    if ( criteria.nuts == true )        {    if ( row[28] != "Y" ) return false;    };
    if ( criteria.plants == true )      {    if ( row[29] != "Y" ) return false;    };
    if ( criteria.soap == true )        {    if ( row[31] != "Y" ) return false;    };
    
    //searchString last
    if ( criteria.searchPhrase != undefined && criteria.searchPhrase.length > 0 ) {
        var tokens = criteria.searchPhrase.split(" ");
        var result = true;
        for ( var i=0; i<tokens.length; i++) {
            if (!result) {
                break;
            }
            var regexp = new RegExp(tokens[i], "i");
            var iterationResult = false;
            if ( regexp.test( row[1] ) ) { iterationResult = true; };
            if ( regexp.test( row[4] ) ) { iterationResult = true; };
            if ( regexp.test( row[5] ) ) { iterationResult = true; };
            if ( regexp.test( row[7] ) ) { iterationResult = true; };
            if ( regexp.test( row[10] ) ) { iterationResult = true; };
            result = iterationResult && result;
        }
        return result;
    }
    
    return true;
}

function criteriaToString( criteria ) { 
    var result = criteria.state;
    
    if (criteria.searchPhrase) {
        result += ", '" + criteria.searchPhrase + "'";
    }
     
    return result;
}

function arrayToMarketObject( arr ) {
    var fields=["fmid","marketName","website","street","city","county","state","zip","x","y","location","credit","wic","wiccash","sfmnp","snap","bakedgoods","cheese","crafts","flowers","seafood","fruit","herbs","vegetables","honey","jams","maple","meat","nuts","plants","prepared","soap","index"];
    var result = {};
    for ( var index in arr ) {
        if ( index <= 10 || index >= 32 ) {
            result[ fields[index] ] = arr[ index ];
        }
        else {
            result[ fields[index] ] = (arr[ index ] == "Y");
        }
    }
    
    result.paymentDetail = result.credit || result.wic || result.wicash || result.sfmnp || result.snap;
    result.productDetail = result.bakedgoods || result.cheese || result.crafts || result.flowers || result.seafood || result.fruit || result.herbs || result.vegetables || result.honey || result.jams || result.maple || result.meat || result.nuts || result.plants || result.prepared || result.soap;
    
    return result;
}

function openExternalURL( url ) {

    var result=confirm("You will leave the Farmers Market Finder App.  Continue?");
    if (result==true) {
        window.open( url, '_blank' );
    }
}

function viewInMap( index ) {
    var market = arrayToMarketObject( markets[index] );
    
     var view = { title: market.marketName,
             backLabel: (isTablet() ? "Back" : " "),
             view: viewAssembler.marketMapView( market ),
             scroll:false
           };
    window.viewNavigator.pushView( view );
}

function getDirections( index ) {
    var market = arrayToMarketObject( markets[index] );

    var result=confirm("You will leave the Farmers Market Finder App.  Continue?");
    if (result==true) {
        
        var win = navigator.userAgent.search( "Windows Phone" ) >= 0;
        var android = navigator.userAgent.search( "Android" ) >= 0;
        
        /*if (win) {
            window.open( ('maps:' + market.y + ',' + market.x), '_blank' );
        } 
        else 
        */
        if (android) {
            navigator.app.loadUrl( 'http://maps.google.com/maps?q=' + market.y + ',' + market.x);
        }
        else {
            window.open( ('http://maps.google.com/maps?q=' + market.y + ',' + market.x), '_blank' );
        }
    }
}


			
document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady() {
   document.addEventListener("backbutton", onBackKey, false);
}

function onBackKey( event ) {
    if ( window.viewNavigator.history.length > 1 ){
        event.preventDefault();
        window.viewNavigator.popView();
        return false;
    }
    navigator.app.exitApp();
}

document.addEventListener('touchmove', function (e) { e.preventDefault(); }, false);