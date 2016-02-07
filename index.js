/*jslint node: true */
'use strict';

var path = require('path');
var fsDiff = require('node-fs-diff');

exports.filters = {};


function subdirFilter() {
	return function( relativePath, fullPath ) {
		var firstdirnameIndex = relativePath.indexOf( '/' );
		if ( firstdirnameIndex < 0 ) {
			firstdirnameIndex = relativePath.indexOf( '\\' );
		}
		if ( firstdirnameIndex > 0 ) {
			return relativePath.substr( 0, firstdirnameIndex );
		}
	};
}

exports.filters.subdir = subdirFilter;



function calculateAllGroups( rootInputPath, options, rootObj ) {
	var atlasList = {};
	
	var processFile = function( fileObj ) {
		var filePath = path.join( rootInputPath, fileObj.relativePath );
		var groupNames = [];

		if ( options.filter ) {
			var result = options.filter( fileObj.relativePath, filePath );
			if ( result ) {
				if ( Array.isArray( result ) ) {
					groupNames = groupNames.concat( result );
				} else {
					groupNames.push( result );
				}
			}
		} else {
			groupNames.push( options.defaultName || "default" );
		}
		groupNames.forEach( function( atlasName ) {
			if ( typeof atlasName !== 'string' ) {
				throw new Error( "Filters should always return either a string or array of strings!" );
			}
			if ( !atlasList.hasOwnProperty( atlasName ) ) {
				atlasList[ atlasName ] = { files: [] };
			}
			atlasList[ atlasName ].files.push( fileObj.relativePath );
		} );
	};
	
	var processDir = function( dirObj ) {
		if ( dirObj.files ) {
			var files = Object.keys( dirObj.files ).map( function( key ) { return dirObj.files[key]; } );
			files.forEach( processFile );
		}
		if ( dirObj.dirs ) {
			var subDirs = Object.keys( dirObj.dirs ).map( function( key ) { return dirObj.dirs[key]; } );
			subDirs.forEach( processDir );
		}
	};
	
	// execute any / all filter objects specified on each subimage file
	processDir( rootObj );
	return atlasList;
}


function getGroupsContainingFile( completeGroupList, file ) {
	var containinggroupNames = [];
	for ( var atlasName in completeGroupList ) {
		if ( completeGroupList.hasOwnProperty( atlasName ) ) {
			var atlas = completeGroupList[ atlasName ];
			if ( atlas.files.indexOf( file ) >= 0 && containinggroupNames.indexOf( atlasName ) < 0 ) {
				containinggroupNames.push( atlasName );
			}
		}
	}
	return containinggroupNames;
}


function calculateChangedGroups( completeGroupList, changedDirs ) {
	var completeFileList = changedDirs.report.files.added.concat( changedDirs.report.files.removed ).concat( changedDirs.report.files.modified );
	var changedGroups = [];
	completeFileList.forEach( function( file ) {
		var groupNames = getGroupsContainingFile( completeGroupList, file );
		groupNames.forEach( function( atlasName ) {
			if ( changedGroups.indexOf( atlasName ) < 0 ) {
				changedGroups.push( atlasName );
			}
		} );
	} );
	return changedGroups;
}


/**
 * @param {object} options - Options object
 * @param {Array|object} options.filter - Separate out certain files into different atlases
 * @param {object} options.manifest - Change manifest
 */
function calculate( rootInputPath, options, callback ) {
	
	options = options || {};
	options.manifest = options.manifest || {};
	options.fsdiff = options.fsdiff || {};
	
	// perform diff on input directory to find which files have changed
	var changedDirs = fsDiff(
			rootInputPath,
			options.manifest,
			options.fsdiff
			//	fileExtensions: [ ".png", ".jpg", ".json" ],
			//	skipDirectoryContentsOnAddRemove: false,
			//	forceAddAll: false
		);

	// calculate complete list of atlas and which files are assigned to which
	var completeGroupList = calculateAllGroups( rootInputPath, options, changedDirs.report.root );
	// work out which atlas have been modified
	var changedGroups = calculateChangedGroups( completeGroupList, changedDirs );
	return callback( null, completeGroupList, changedGroups, changedDirs.manifest );
}


exports.calculate = calculate;

