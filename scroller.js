$(document).ready(function() {
    var NoMaxPageOverride = false; // This variable is used to catch non-mangalisting pages. By default, set false.

    var openPageUrl = window.location.href;
    var openPageApiUrl = convertToAPIPage(openPageUrl);

    var openPageBaseUrl;
    var openPageBaseApiUrl;

    var $contentDiv = $('#content');
    var $mangaListingDiv; // Custom Div because pagination is in $contentDiv
    var $loadMoreDiv;

    var allowInfiniteScroll = true;

    var options = new Array();

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
    });
    
    var rowId = 0; // For Tag Blocking
    var page;
    var maxPage;

    $.ajax({
        url: openPageApiUrl,
        dataType: 'json',
        async: false,
        success: function(openPageApi) {
            if(openPageApi['pages']) {
                maxPage = openPageApi.pages;
                page = openPageApi.page;

                if (page == maxPage) {
                    allowInfiniteScroll = false;
                }
            } else {
                NoMaxPageOverride = true; // If no openPageApi['pages'], that means no manga listing.
            }
        }
    }); 

    if(NoMaxPageOverride == false) {

        $('head').append('<style>.hiddenMangaTitle{color:#9D0A0A}</style>')

        // Completely custom reload manga so that tag blocking is possible.
        $.getJSON(openPageApiUrl, function(pageJSON) {
            var mangaListingRaw = pageJSON['content'];

            $('.content-row.row').remove();
            $contentDiv.prepend('<div id="mangaListing"></div>')
            $mangaListingDiv = $('#mangaListing')

            $mangaListingDiv.on('click', '.showHiddenManga', function() {
                var clickedRowId = $(this).data('rowid');
                $('#hiddenManga' + clickedRowId + 'Warning').remove();
                $('#hiddenManga' + clickedRowId + 'HideDiv').css('display', 'block');

            });

            if(options['endlessScrolling']) {
                if(page == 1) {
                    openPageBaseUrl = openPageUrl + '/page/';
                    openPageBaseApiUrl = convertToAPIPage(openPageBaseUrl);
                } else {
                    openPageBaseUrl = openPageUrl.replace('/page/' + page, '/page/')
                    openPageBaseApiUrl = convertToAPIPage(openPageBaseUrl)
                }
                $('#pagination').remove(); // Remove the Pagination
                $contentDiv.append(createHTMLFor('loadMore'));
                $mangaListingDiv.prepend(createHTMLFor('pageHeader'));
                $mangaListingDiv.prepend(createHTMLFor('mainHeader'));

                $loadMoreDiv = $('#loadMore');

            }

            $.each(mangaListingRaw, function(key, mangaJSON) {
                finalHTML = loadMangaFromMangaJSON(mangaJSON);
                $mangaListingDiv.append(finalHTML);
            });
        });

        $(window).scroll(function() {
            /* Infinite Scrolling */
            if($loadMoreDiv.visible()) {
                if (allowInfiniteScroll) {
                    allowInfiniteScroll = false; // Prevents multiple loadings
                    page++;
                    loadNextPage();
                }
            }
        });

    }

    // Utility Functions
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    function createHTMLFor(htmlFor) {
        if (htmlFor == 'mainHeader') {
            return '<div class="content-row doujinshi row"><div class="content-meta twelve columns"><p><b>Endless Scrolling <span style="color:green;">Activated</span> <a target="_blank" href="https://www.fakku.net/forums/fakku-developers/chromeextension-fakku-endless-scrolling" class="x-small">Leave a comment</a></b></p></div></div>';
        } else if (htmlFor == 'pageHeader') {
            return '<div class="content-row doujinshi row"><div class="content-meta twelve columns"><p><b><a href="' + openPageBaseUrl + page + '" target="_blank">Page ' + page + '</a> of ' + maxPage + '</b></p></div></div>';
        } else if (htmlFor == 'loadMore') {
            return '<div id="loadMore" class="content-row doujinshi row"><div class="content-meta twelve columns"><p><b>Load more?!?!?</b></div></div>';
        } else if (htmlFor == 'footer') {
            return '<div class="content-row doujinshi row"><div class="content-meta twelve columns"><p><b>That\'s all folks! <a target="_blank" href="https://www.fakku.net/forums/fakku-developers/chromeextension-fakku-endless-scrolling" class="x-small">Leave a comment</a></b></p></div></div>';
        }
    }


    function convertToAPIPage(url) {
        return url.replace('https://www.', 'https://api.');
    }

    function loadNextPage() {
        var dynamicListingUrl = openPageBaseUrl + page;
        var dynamicListingApiUrl = openPageBaseApiUrl + page;

        console.log(dynamicListingApiUrl)

        $.get(dynamicListingUrl, function(data) {
            // Using ajax instead of get because if initial page is the last page, get crashes, ajax has error handling and auto ends
            $.getJSON(dynamicListingApiUrl, function(data) {
                var listingRaw = data['content'];
                $mangaListingDiv.append(createHTMLFor('pageHeader'));

                $.each(listingRaw, function(key, mangaJSON) {
                    finalHTML = loadMangaFromMangaJSON(mangaJSON);
                    $mangaListingDiv.append(finalHTML);
                });

                // If last page... Just end.
                if (page == maxPage) {
                    $loadMoreDiv.remove()
                    $contentDiv.append(createHTMLFor('footer'));
                } else {
                    allowInfiniteScroll = true;
                }
            });
        });
    }

    function loadMangaFromMangaJSON(mangaJSON) {
        var finalHTML = '';
        var hideManga = false;

        // Do tags first so tag blocking is possible.
        // Tags
        var tagsInTagsToBlock = new Array();
        var tagsHTML = '';
        $.each(mangaJSON['content_tags'], function(index, tagJSON) {
            if($.inArray(tagJSON['attribute'], options['tagsToBlock']) !== -1) { // If in array...
                tagsInTagsToBlock.push(tagJSON['attribute'].toLowerCase());
                hideManga = true;
            }
            tagsHTML += '<a  target="_blank" href="' + tagJSON['attribute_link'] + '"  class="attribute-' + tagJSON['attribute_id'] + '">' + tagJSON['attribute'].toLowerCase() + '</a> '
        });

        finalHTML += '<div class="content-row ' + mangaJSON['content_category'] + ' row">'

        if(hideManga == true) {
            finalHTML += '<div id="hiddenManga' + rowId + 'Warning" class="twelve columns"><p><b>Blocking:</b> <span class="hiddenMangaTitle">' + mangaJSON['content_name'] + '</span> for <span class="tags"><a>' + tagsInTagsToBlock.join('</a> <a>') + '</a></span><br><input type="button" class="showHiddenManga" value="Show" data-rowid="' + rowId + '"></p></div>'
            finalHTML += '<div id="hiddenManga' + rowId + 'HideDiv" style="display:none;">'
        }

        finalHTML += '<div class="images four columns">'
        finalHTML += '<a  target="_blank" href="' + mangaJSON['content_url'] + '">'
        finalHTML += '<img class="cover" alt="' + mangaJSON['content_name'] + '" src="' + mangaJSON['content_images']['cover'] + '">'
        finalHTML += '<img class="sample" alt="' + mangaJSON['content_name'] + ' Sample" src="' + mangaJSON['content_images']['sample'] + '">'
        finalHTML += '</a>'
        finalHTML += '</div>'
        finalHTML += '<div class="content-meta eight columns">'
        finalHTML += '<h2>'
        finalHTML += '<a  target="_blank" class="content-title" href="' + mangaJSON['content_url'] + '" title="' + mangaJSON['content_name'] + '">' + mangaJSON['content_name'] + '</a>'
        finalHTML += '<a  target="_blank" class="content-time" href="' + mangaJSON['content_url'] + '" title="' + mangaJSON['content_name'] + '"><span class="show-mobile">Uploaded</span> ' + $.timeago(new Date(mangaJSON['content_date'] * 1000)) + '</a>'
        finalHTML += '</h2>'
        finalHTML += '<div class="row hidden-mobile">'

        // Series
        finalHTML += '<div class="left">Series</div>'
        finalHTML += '<div class="right">'
            $.each(mangaJSON['content_series'], function(index, seriesJson) {
                finalHTML += '<a  target="_blank" href="' + seriesJson['attribute_link'] + '">' + seriesJson['attribute'] + '</a>'

               // Easier this way than trying to use an array.
                if (index + 1 != mangaJSON['content_series'].length) {
                    finalHTML += ", "
                }
            });
        finalHTML += '</div>'
        
        finalHTML += '</div>'

        // Artists
        finalHTML += '<div class="row hidden-mobile">'
            finalHTML += '<div class="left">Artist</div>'
            finalHTML += '<div class="right">'
                $.each(mangaJSON['content_artists'], function(index, artistJson) {
                    finalHTML += '<a  target="_blank" href="' + artistJson['attribute_link'] + '">' + artistJson['attribute'] + '</a>'

                    // Easier this way than trying to use an array.
                    if (index + 1 != mangaJSON['content_artists'].length) {
                        finalHTML += ", "
                    }
                });
            finalHTML += '</div>'
        finalHTML += '</div>'

        // Language
        finalHTML += '<div class="row hidden-mobile ' + mangaJSON['content_language'] + '">'
            finalHTML += '<div class="left">Language</div>'
            finalHTML += '<div class="right"><a  target="_blank" href="/' + mangaJSON['content_category'] + '/' + mangaJSON['content_language'] + '">' + capitalizeFirstLetter(mangaJSON['content_language']) + '</a></div>'
        finalHTML += '</div>'

        finalHTML += '<div class="row hidden-mobile">'

        // Description
        finalHTML += '<div class="left">Description</div>'
            finalHTML += '<div class="right">' + mangaJSON['content_description'] + '</div>'
        finalHTML += '</div>'

        finalHTML += '<div class="row">'

        // Tags
        finalHTML += '<div class="left hidden-mobile">Tags</div>'
        finalHTML += '<div class="right tags">'
            finalHTML += tagsHTML
            finalHTML += '<a  target="_blank" href="' + mangaJSON['content_url'] + '" class="more-tags hidden-mobile">...</a>'
        finalHTML += '</div>'
        
        finalHTML += '</div>'
        finalHTML += '</div>'
        finalHTML += '</div>'

        if(hideManga == true) {
            finalHTML += '</div>'
        }

        rowId++;

        return finalHTML;
    }
});