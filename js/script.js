/* Author: 

*/


    var pixelations = {
      'dress' : [
        { shape: 'square', resolution: 14 },
        { shape: 'circle', resolution: 14, offset: 10, alpha: 0.5 },
        { shape: 'diamond', resolution: 24, offset: 22 },
        { shape: 'circle', resolution: 8, size: 14, offset: 25, alpha: 0.3 }
      ]
    };

    var docReady = function() {
		$('#main img').click(function(){
			$('#main').toggleClass('first')
			$('#main').toggleClass('flipped')
		  for ( var key in pixelations ) {
			var img = document.getElementById( key ),
				options = pixelations[key];
			if ( img ) { 
			  img.closePixelate( options )
			}
		  }
	   });
    };

    window.addEventListener( 'DOMContentLoaded', docReady, false);  




















