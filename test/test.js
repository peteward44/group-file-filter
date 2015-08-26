/*global describe:false, it:false */

'use strict';

var path = require('path');
var groupfilter = require('../');

var fixturesPath = path.join( __dirname, "fixtures" );

describe('monitor', function() {

	it('Uses no filter', function(done) {
		groupfilter.calculate(
				path.join( fixturesPath, 'root1' ),
				{
				},
				function( err ) {
					done();
				}
			);
	});
	
	it('Uses subdir filter to create atlases', function(done) {
		groupfilter.calculate(
				path.join( fixturesPath, 'root1' ),
				{
					filter: groupfilter.filters.subdir()
				},
				function( err ) {
					done();
				}
			);
	});
});

