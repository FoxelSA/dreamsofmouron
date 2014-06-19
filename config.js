/**
 * Website of the Dreams of Mouron project.
 *
 * Copyright (c) 2013-2014 FOXEL SA - http://foxel.ch
 * Please read <http://foxel.ch/license> for more information.
 *
 *
 * Author(s):
 *
 *      Oleg Lavrovsky
 *
 *
 * Contributor(s):
 *
 *      Alexandre Kraft <a.kraft@foxel.ch>
 *
 *
 * This file is part of the FOXEL project <http://foxel.ch>.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
 *
 * Additional Terms:
 *
 *      You are required to preserve legal notices and author attributions in
 *      that material or in the Appropriate Legal Notices displayed by works
 *      containing it.
 *
 *      You are required to attribute the work as explained in the "Usage and
 *      Attribution" section of <http://foxel.ch/license>.
 */

/*
 Filename of the panorama scene
*/
PANO.panorama = 'img/dreamsofmouron.jpeg';

/* Content of optional welcome dialog box */
PANO.welcome = 'welcome';

/*
 Definition of the audio environment:

 The first parameter is the source of the audio, i.e. an MP3 file.

 The second parameter is the location in degrees off center, left to right
 - e.g. 0 = in front at start, 180 = in the back at start
 - set to null to use the default equidistant placement
 - set PANO.helper to true for an aiming reticle and degrees in the browser title

 The third parameter is a displacement of the clickable area
 - greater than 0 is up, < 0 down
 - default is 0, equivalent to null

 The fourth parameter is HTML content to be displayed in a dialog when the orb
 surrounding the area of the audio source is clicked.
*/
PANO.sounds = [
    [ "argo.mp3", 74, -1.5, 'paint1', 1.4 ],            // mp3file, center, horizontal, divname, spheresize
    [ "jesrad.mp3", 113, -1.5, 'paint2', 1.3 ],
    [ "combien.mp3", 181, -4, 'paint3', 4.1 ],
    [ "chronostwo.mp3", 241, -2.1, 'paint4', 1.5 ],
    [ "chambre.mp3", 294, -2, 'paint5', 1.5 ]
];

/* Optional background source, and it's loudness from 0 to 1*/
PANO.bgsound = [ "background.mp3" ];

/*
 When true, shows blue orbs ("helpers") at the sound locations,
 the sound currently playing, and orientation of the camera in
 the browser title.
*/
PANO.helper = false;

/*
 Dialog sizes
*/
PANO.dialogWidth = 850;
PANO.dialogHeight = new Array();
PANO.dialogHeight['welcome'] = 373;
PANO.dialogHeight['paint1'] = 455;
PANO.dialogHeight['paint2'] = 418;
PANO.dialogHeight['paint3'] = 350;
PANO.dialogHeight['paint4'] = 360;
PANO.dialogHeight['paint5'] = 433;

