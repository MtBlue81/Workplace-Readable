/* 
 * Read Posts Later
 */

String.prototype.truncate = function (length) {
    return (this.length > length) ? this.substring(0, length - 1) + '…' : this.valueOf();
};

$(function () {
    // Save hostname to generate permanent links in popup.html
    chrome.storage.sync.set({ hostname: location.hostname });

    $(document).on('mouseenter', '.userContentWrapper, .fbUserContent', function () {
        if ($(this).find('.userContentWrapper, .fbUserContent').length > 0) {
            return; // this is not body but header content
        }
        $(this).find('.userContent').each(function () {
            addReadLaterButton($(this).not(':empty'));
        });
    });

    // Add "Read Later" button in user content
    function addReadLaterButton($content) {
        chrome.storage.sync.get({ posts: [] }, function (items) {
            var $wrapper = $content.closest('.userContentWrapper, .fbUserContent');
            var url = $wrapper.find('a._5pcq').attr('href');
            var isPinned = getPostIndexOf(items.posts, url) != -1;

            $readLater = $content.children('.readLater');
            if ($readLater.length > 0) {
                $readLater.toggleClass('pinned', isPinned);
                return;
            }

            $element = $(`
                <a class="readLater ${isPinned ? 'pinned' : ''} _42ft _4jy0 _4jy4 _517h _51sy"
                    role="button" href="#">
                    <i class="img"></i>
                </a>`)
                .click(function () {
                    var isPinned = $(this).hasClass('pinned');
                    var toggleClass = function () {
                        $element.toggleClass('pinned');
                    };
                    if (isPinned) {
                        removePost(url, toggleClass);
                    } else {
                        addPost($wrapper, url, toggleClass);
                    }
                });
            $content.prepend($element);
        });
    }

    /**
     * Save a post to read later to chrome.storage
     */
    function addPost($wrapper, url, callback) {
        chrome.storage.sync.get({ posts: [] }, function (items) {
            var author = $wrapper.find('.fwb > a[href*="profile.php"]').first().text();
            var group = $wrapper.find('.fcg > a.profileLink[href*="/groups/"], .fcg > a._wpv[href*="/groups/"]').first().text();
            if (group == "") {
                group = $('head > title').text().replace(/^\(\d+\) /, '');
            }
            var date = $wrapper.find('abbr').attr('data-utime');
            var intro = $wrapper.find('.userContent').clone()
                .find('.readLater, .expandAll').remove().end().text();

            var post = {
                url: url,
                author: author.truncate(15),
                group: group.truncate(20),
                date: parseInt(date, 10),
                intro: intro.truncate(75)
            };
            items.posts.push(post);

            chrome.storage.sync.set({ posts: items.posts }, callback);
        });
    }

    /**
     * Remove a post to read later from chrome.storage
     */
    function removePost(url, callback) {
        chrome.storage.sync.get({ posts: [] }, function (items) {
            var index = getPostIndexOf(items.posts, url);
            items.posts.splice(index, 1);

            chrome.storage.sync.set({ posts: items.posts }, callback);
        });
    }

    function getPostIndexOf(posts, url) {
        var index = -1;
        $.each(posts, function (i, post) {
            if (post.url == url) {
                index = i;
                return false;
            }
        });
        return index;
    }
});