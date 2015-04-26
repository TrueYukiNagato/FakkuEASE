var tags = new Array();tags.push('Ahegao');tags.push('Anal');tags.push('Animated');tags.push('Ashikoki');tags.push('Bakunyuu');tags.push('Bara');tags.push('Biting');tags.push('Bondage');tags.push('Cheating');tags.push('Chikan');tags.push('Chubby');tags.push('Color');tags.push('Cosplay');tags.push('Cunnilingus');tags.push('Dark');tags.push('Skin');tags.push('Decensored');tags.push('Ecchi');tags.push('Fangs');tags.push('Femdom');tags.push('Forced');tags.push('Futanari');tags.push('Genderbend');tags.push('Glasses');tags.push('Group');tags.push('Gyaru');tags.push('Hairy');tags.push('Harem');tags.push('Headphones');tags.push('Hentai');tags.push('Horror');tags.push('Housewife');tags.push('Humiliation');tags.push('Idol');tags.push('Incest');tags.push('Inseki');tags.push('Irrumatio');tags.push('Kemonomimi');tags.push('Lingerie');tags.push('Loli');tags.push('Maid');tags.push('Monster');tags.push('Girl');tags.push('Nakadashi');tags.push('Netorare');tags.push('Netori');tags.push('Non-H');tags.push('Nurse');tags.push('Oppai');tags.push('Oral');tags.push('Osananajimi');tags.push('Oshiri');tags.push('Paizuri');tags.push('Pegging');tags.push('Pettanko');tags.push('Pregnant');tags.push('Random');tags.push('Raw');tags.push('Schoolgirl');tags.push('Shibari');tags.push('Shimapan');tags.push('Socks');tags.push('Stockings');tags.push('Swimsuit');tags.push('Tanlines');tags.push('Teacher');tags.push('Tentacles');tags.push('Tomboy');tags.push('Toys');tags.push('Trans');tags.push('Trap');tags.push('Tsundere');tags.push('Uncensored');tags.push('Vanilla');tags.push('Western');tags.push('X-ray');tags.push('Yandere');tags.push('Yaoi');tags.push('Yuri');
function getFormattedDate() {
	var date = new Date();
	var str = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +  date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();

	return str;
}

$(document).ready(function() {
	var options = new Array();

	// Load defaults
	chrome.storage.sync.get(['initialized', 'tagsToBlock', 'endlessScrolling'], function(resultsFromStorage) {
		if(resultsFromStorage.initialized == true) {
			options['initialized'] = true;
			options['endlessScrolling'] = resultsFromStorage.endlessScrolling;
			options['tagsToBlock'] = resultsFromStorage.tagsToBlock;
		} else {
			options['initialized'] = false;
			options['endlessScrolling'] = true;
			options['tagsToBlock'] = new Array();
		}

		if(options['endlessScrolling']) {
			$('.options_endlessScrolling').prop('checked', true);
		}

		loadTags();
	});

	$('#saveButton').on('click', function() {
		/* Get endlessScrolling */
		if ($('.options_endlessScrolling').is(':checked')) {
			options['endlessScrolling'] = true;
		} else {
			options['endlessScrolling'] = false;
		}

		/* Get TagsToBlock */
		options['tagsToBlock'].length = 0;
		$('.options_tagToBlock:checked').each(function(index) {
			var tagName = $(this).val();
			options['tagsToBlock'].push(tagName)
		});

		if(options['initialized'] == false) {
			console.log('Initializing')
			chrome.storage.sync.set({
				initialized: true
			});
		}

		chrome.storage.sync.set({
			endlessScrolling: options['endlessScrolling'],
			tagsToBlock: options['tagsToBlock']
		}, function() {
			$('#saveStatus').html('Updated ' + getFormattedDate() + ' ')
		});
	});

	function loadTags() {
		var finalHTML = '';

		$tagsToggleArray = $('#tagsToggleArray');
		$.each(tags, function(tagIndex, tagName) {
			if(tagIndex == 0) {
				finalHTML += '<tr>'
			} else if(tagIndex % 2 == 0) {
				finalHTML += '</tr>'
				finalHTML += '<tr>'
			}

			finalHTML += '<th>' + tagName + '</th>'
			finalHTML += '<td><input type="checkbox" value="' + tagName + '" class="options_tagToBlock"';

			if($.inArray(tagName, options['tagsToBlock']) !== -1) {
				finalHTML += ' checked'
			}

			finalHTML += '> Block</td>'

			if(tagIndex == tags.length) {
				finalHTML += '</tr>'
			}
		})

		$tagsToggleArray.append(finalHTML);
	}
});