// ==UserScript==
// @name         ReddUX
// @namespace    https://reddit.com/
// @version      0.5
// @description  Reddit UX featurepack
// @author       nev3rfail
// @match        https://www.reddit.com/*
// @grant        GM_getValue
// ==/UserScript==

(function() {
    'use strict';

    const script_name = GM_info.script.name;
    const eye_icon = document.createElement('span');
    eye_icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" x="0px" y="0px" width="15px" height="15px" viewBox="0 0 456.795 456.795" style="enable-background:new 0 0 456.795 456.795;" xml:space="preserve"><g>	<g>		<path d="M448.947,218.475c-0.922-1.168-23.055-28.933-61-56.81c-50.705-37.253-105.877-56.944-159.551-56.944    c-53.672,0-108.844,19.691-159.551,56.944c-37.944,27.876-60.077,55.642-61,56.81L0,228.397l7.846,9.923    c0.923,1.168,23.056,28.934,61,56.811c50.707,37.252,105.879,56.943,159.551,56.943c53.673,0,108.845-19.691,159.55-56.943    c37.945-27.877,60.078-55.643,61-56.811l7.848-9.923L448.947,218.475z M228.396,315.039c-47.774,0-86.642-38.867-86.642-86.642    c0-7.485,0.954-14.751,2.747-21.684l-19.781-3.329c-1.938,8.025-2.966,16.401-2.966,25.013c0,30.86,13.182,58.696,34.204,78.187    c-27.061-9.996-50.072-24.023-67.439-36.709c-21.516-15.715-37.641-31.609-46.834-41.478c9.197-9.872,25.32-25.764,46.834-41.478    c17.367-12.686,40.379-26.713,67.439-36.71l13.27,14.958c15.498-14.512,36.312-23.412,59.168-23.412    c47.774,0,86.641,38.867,86.641,86.642C315.037,276.172,276.17,315.039,228.396,315.039z M368.273,269.875    c-17.369,12.686-40.379,26.713-67.439,36.709c21.021-19.49,34.203-47.326,34.203-78.188s-13.182-58.697-34.203-78.188    c27.061,9.997,50.07,24.024,67.439,36.71c21.516,15.715,37.641,31.609,46.834,41.477    C405.91,238.269,389.787,254.162,368.273,269.875z"/>		<path d="M173.261,211.555c-1.626,5.329-2.507,10.982-2.507,16.843c0,31.834,25.807,57.642,57.642,57.642    c31.834,0,57.641-25.807,57.641-57.642s-25.807-57.642-57.641-57.642c-15.506,0-29.571,6.134-39.932,16.094l28.432,32.048    L173.261,211.555z"/>	</g></g></svg>';
    /* Some utils below */
    let _c;

    var reddit_path = "/";
    var defconfig = {
        "ignored_authors":[],
        "ignored_subreddits":[],
        "hide_read_posts":false,
        "mark_read_posts":true,
        "debug":false,
        "enable_nano_nav":true
    };
    try {
        _c = JSON.parse(window.localStorage.getItem(script_name));
        if(!Object.keys(_c).length) {
            throw new Error('Empty');
        }
    } catch(e) {
        console.log('Config is empty, using defconfig');
        _c = defconfig;
    }
    var config = {
        values:_c,
        set:function(param, value) {
            this.values[param] = value;
            window.localStorage.setItem(script_name, JSON.stringify(this.values));
        },
        get:function(param) {
            return this.values[param];
        }
    };

    var settings_rendered = false;

    function render_settings(event) {
        var block = event.target.parentNode;
        //console.log("YUP");
        //return;
        var onchange = function(e) {
            let checkbox = e.target;
            config.set(checkbox.id, checkbox.checked);
        };

        var create_config_item = function(caption, id, value) {
            let checkbox = document.createElement('input');
            checkbox.setAttribute('id', id);
            checkbox.setAttribute('type', 'checkbox');
            if(value) {
                checkbox.checked = true;
            }
            checkbox.onchange = onchange;
            let label = document.createElement('label');
            label.innerText = caption;
            label.setAttribute('for', id);

            let tr = document.createElement('tr');
            tr.append(document.createElement('td'));
            tr.append(document.createElement('td'));
            tr.children[0].append(label);
            tr.children[1].append(checkbox);
            return tr;
        };

        if(!settings_rendered) {

            var sett_table = document.createElement('table');
            sett_table.className = "enhanced_settings";
            var pew = document.createElement('style');
            pew.innerText = ".enhanced_settings [type=checkbox] { visibility: visible!important; }";
            document.body.append(pew);
            [
                create_config_item("Mark read posts", 'mark_read_posts', config.get('mark_read_posts')),
                create_config_item("hide_read_posts", 'hide_read_posts', config.get('hide_read_posts')),
                create_config_item("Debug mode [do not enable this]", 'debug', config.get('debug')),
            ].forEach(function(tr) { sett_table.append(tr); });
            block.append(sett_table);
            settings_rendered = true;
            //document.querySelector('form[name="general"] .page-settings__table tbody').append();
        } else {
            block.children[1].style.display = block.children[1].style.display === 'none' ? '' : 'none';
        }
    }


    function findParentBySelector(el, selector) {
        var num = 1;
        var maxnum = 10; //no reason to crawl through all dom
        while (el.parentNode) {
            ++num;
            el = el.parentNode;
            if(el.matches === undefined) {
                return null;
            }
            if (el.matches(selector)) {
                return el;
            }
            if(num == maxnum) {
                return null;
            }
        }
        return null;
    }

    let rp;
    try {
        rp = JSON.parse(window.localStorage.getItem(script_name+'.read_posts'));
        if(!rp.length) {
            throw new Error('Empty');
        }
    } catch(e) {
        console.log('No read posts yet.');
        rp = [];
    }

    console.log(rp.length+' read posts in storage.');

    var read_posts = {
        values:rp,
        push:function(value) {
            this.values.push(value);
            window.localStorage.setItem(script_name+'.read_posts', JSON.stringify(this.values));
        },
        get:function(param) {
            return this.values;
        },
        check:function(id) {
            return this.values.indexOf(id)+1;
        }
    };

    var debug = config.get("debug");
    var ignored_subreddits = []; //empty here because of dyn url change. see onload()
    var ignored_authors = [];
    var is_subreddit = false;
    var is_user = false;
    var subreddit_ignored = false;
    var user_ignored = false;
    var is_post = false;
    var mark_read_posts = config.get("mark_read_posts");
    var hide_read_posts = config.get("hide_read_posts");

    var lasturl = window.location.pathname;

    /* stuff to do on page load AND on dynamic content load */
    function onload(e) {
        if(e !== undefined) {
            //console.log(e);
            if(lasturl === e.detail.location.pathname || lasturl+'/' === e.detail.location.pathname) {
                //console.log('nopush');
                return;
            } else {
                lasturl = e.detail.location.pathname;
            }
        }
        reddit_path = '/'+window.location.pathname.split('/').slice(1,3).join('/');
        is_subreddit = window.location.pathname.match(/^\/r\//) && !window.location.pathname.match(/^\/r\/all/);
        is_user = window.location.pathname.match(/^\/user\//);
        is_post = '/'+window.location.pathname.split('/').slice(3,4).join('/') === '/comments';
        ignored_subreddits = config.get("ignored_subreddits");
        ignored_authors = config.get("ignored_authors");
        subreddit_ignored = false;
        user_ignored = false;
        console.log('Path is '+reddit_path+', fixing ingore lists...');
        /* we need to remove items from ignore lists if we are currently on ignored author/subreddit */

        if(is_subreddit) {
            for(let i in ignored_subreddits) {
                /* string can be plain or with leading /r/ */
                if('/r/'+ignored_subreddits[i] == reddit_path || ignored_subreddits[i] == reddit_path) {
                    ignored_subreddits.pop(i);
                    subreddit_ignored = true;
                    console.log('Temporary unignoring '+reddit_path);
                }
            }
            if(is_post) {
                do_sidebar();
            }
        }



        if(is_user) {
            for(let i in ignored_authors) {
                if('/r/'+ignored_authors[i] == reddit_path || ignored_authors[i] == reddit_path) {
                    ignored_authors.pop(i);
                    user_ignored = true;
                    console.log('Temporary unignoring '+reddit_path);
                }
            }
            do_sidebar();
        }
        /*
        for(let i in ignored_subreddits) {
            let pew = ignored_subreddits[i];
            if(!pew.match(/^\/r\//)) {
                pew = '/r/'+pew;
            }
            if(pew.match(/^r\//)) {
                pew = '/'+pew;
            }
            pew = pew+'/';
            let ugly = document.querySelectorAll('a[data-click-id="subreddit"][href="'+pew+'"]');
            ugly.forEach(function(item) {
                console.log(item.parentNode);
            });
        } */

    }
    onload();

    function remove_visited() {

    }

    function reddit_handler(e) {
        var type = e.detail.type;
        var data = e.detail.data;
        //console.log(type, data);
        switch(type) {
            //case 'post':
            case 'postAuthor':
                do_post({author:data.author, id:data.post.id, title:'no title (err)', subreddit:data.subreddit});
                break;
            case 'postModTools':
                //do_post(data, e.target);
                break;
            case 'sidebar':
                do_sidebar(data, e.target);
                break;
            default:
                if(debug) {
                    console.log(type+' handler is not implemented.');
                }
        }
    }

    function scroll_handler() {
        mark_read(current_post());
    }

    function mouseover_handler(e) {
        mark_read(findParentBySelector(e.target, '.scrollerItem'));
    }
    function _mark_read(cp) {
        cp.setAttribute('data-visited', true);
        var cont = cp.querySelector('[data-name="'+script_name+'"]');
        if(!cont.children.length) { cont.append(eye_icon.cloneNode(true)); }
    }
    function mark_read(cp) {
        if(cp && !cp.getAttribute('data-visited')) {
            _mark_read(cp);
            if(!read_posts.check(cp.id)) {
                console.log(cp.id+ ' marked as read.');
                read_posts.push(cp.id);
            }
        }
    }



    function current_post() {
        var zoom = parseFloat((window.outerWidth/parseInt(getComputedStyle(document.documentElement,null).width)).toFixed(2));
        var el = document.elementFromPoint((window.outerWidth/zoom)/2, (window.outerHeight/zoom)/4);
        return findParentBySelector(el, '.scrollerItem');
    }

    function is_ignored(post) {
        var ignored = false;
        ignored_authors.some(function(author) {
            ignored = author.replace(/^u\//g, '').replace(/^user\//g, '').replace(/^\/user\//g, '') === post.author;
            return ignored;
        });
        if(!ignored && post.subreddit.name) {
            ignored_subreddits.some(function(subreddit) {
                //console.log(post.subreddit.name, subreddit.replace(/^r\//g, '').replace(/^\/r\//g, ''), JSON.stringify(post.subreddit.name), JSON.stringify(subreddit.replace(/^r\//g, '').replace(/^\/r\//g, '')));
                ignored = subreddit.replace(/^r\//g, '').replace(/^\/r\//g, '') === post.subreddit.name;
                return ignored;
            });
        }
        return ignored;
    }


    function do_post(post) {
        if(!is_post) {
            let id = post.id;
            var post_block = document.getElementById(post.id);
            var post_container;
            if(post_block) {
                if(post_block.parentNode && post_block.parentNode.children.length === 1) {
                    post_container = post_block.parentNode;
                } else {
                    post_container = post_block;
                }
                if(is_ignored(post)) {
                    console.log(post.id+ ': '+post.author+'@'+post.subreddit.name+' is from ignored subreddit or from ignored user.');
                    post_container.remove();
                    return;
                }

                if(mark_read_posts && read_posts.check(post.id)) {
                    if(config.get('hide_read_posts')) {
                        console.log(post.id+ ': '+post.author+'@'+post.subreddit.name+' has been read already, hiding.');
                        post_container.remove();
                        return;
                    } else {
                        _mark_read(post_block);
                    }

                }
            } else {
                console.log(post.id+' does not exists.');
            }
        }
    }

    function ignore_subreddit() {
        if(is_subreddit) {
            if(subreddit_ignored) {
                return false;
            } else {
                let ignored = config.get('ignored_subreddits');
                ignored.push(reddit_path);
                subreddit_ignored = true;
                config.set('ignored_subreddits', ignored);
                console.log('Ignoring '+reddit_path);
                let btn = document.querySelector('#ignore');
                btn.innerText = "Unignore";
                btn.onclick = unignore_subreddit;
            }
        } else {
            return false;
        }
    }



    function unignore_subreddit() {
        if(is_subreddit) {
            let _ignored_subreddits = config.get('ignored_subreddits');
            for(let i in _ignored_subreddits) {
                if('/r/'+_ignored_subreddits[i] == reddit_path || _ignored_subreddits[i] == reddit_path) {
                    _ignored_subreddits.pop(i);
                    subreddit_ignored = false;
                    config.set('ignored_subreddits', _ignored_subreddits);
                    console.log('Unignoring '+reddit_path);

                    let btn = document.querySelector('#ignore');
                    btn.innerText = "Ignore";
                    btn.onclick = ignore_subreddit;
                }
            }
        }
    }
    function ignore_user() {
        if(is_user) {
            if(user_ignored) {
                return false;
            } else {
                let ignored = config.get('ignored_authors');
                ignored.push(reddit_path);
                config.set('ignored_authors', ignored);
                console.log('Ignoring '+reddit_path);
                let btn = document.querySelector('#ignore');
                btn.innerText = "Unignore";
                btn.onclick = unignore_user;
            }
        } else {
            return false;
        }
    }
    function unignore_user() {
        if(is_user) {
            let _ignored_authors = config.get('ignored_authors');
            for(let i in _ignored_authors) {
                if('/user/'+_ignored_authors[i] == reddit_path || _ignored_authors[i] == reddit_path) {
                    _ignored_authors.pop(i);
                    config.set('ignored_authors', _ignored_authors);
                    user_ignored = true;
                    console.log('Unignoring '+reddit_path);
                    let btn = document.querySelector('#ignore');
                    btn.innerText = "Ignore";
                    btn.onclick = ignore_user;
                }
            }
        }
    }

    function do_sidebar(data, target, force) {

        console.log('Sidebar:', data, target, force);
        if(target === undefined) {
            if((is_post || is_user) && !force) {
                setTimeout(function() { do_sidebar(undefined, undefined, true); }, 200);
                return;
            }
            let links = document.querySelectorAll('a[href="'+reddit_path+'/"]');
            console.log(links, links.length);
            if(!links.length) {
                links = document.querySelectorAll('a[href="'+reddit_path+'"]');
            }
            if(!links.length) {
                setTimeout(function() { do_sidebar(undefined, undefined, true); }, 200);
                return;
            }
            target = links[links.length-1];
            let pew = document.createElement('span');
            pew.innerText = target.innerText;
            target.innerText = '';
            target.append(pew);

        }
        //console.log(target);
        if(target.children[0].getAttribute('data-loaded')) {
            return; //sidebar already exists
        } else {
            target.children[0].setAttribute('data-loaded', true);
        }
        if(is_subreddit) {
            let sidebar = target.parentNode.parentNode;
            let link = sidebar.querySelector('a[href="'+reddit_path+'/submit"]');
            let oldbutton = link.previousSibling;
            let button_container = oldbutton.parentNode;
            let button = document.createElement('span');
            button.className = oldbutton.className;
            button.id = "ignore";
            if(subreddit_ignored) {
                button.innerText = "Unignore";
                button.onclick = unignore_subreddit;
            } else {
                button.innerText = "Ignore";
                button.onclick = ignore_subreddit;
            }
            button.style['margin-top'] = "8px";
            button_container.append(button);

        } else if(is_user) {
            let sidebar = target.parentNode.parentNode;
            let oldbutton = sidebar.querySelector('a[href*="/chat/user_id"]');
            if(oldbutton) {
            let oldbutton_container = oldbutton.parentNode;
            let button = document.createElement('span');
            let button_container = document.createElement('span');
            button_container.className = oldbutton_container.className;
            button_container.append(button);
            button.className = oldbutton.className;
            button.id = "ignore";
            if(user_ignored) {
                button.innerText = "Unignore";
                button.onclick = unignore_user;
            } else {
                button.innerText = "Ignore";
                button.onclick = ignore_user;
            }

            oldbutton_container.parentNode.append(button_container);
            } else {
                console.log('No user link. No user link. Where are we?');
            }
        }
    }

    function init() {
        if (!document.querySelector('meta[name="jsapi"]')) {
            console.log('JS API is not supported.');
            return;
        }

        document.addEventListener('reddit', reddit_handler, true);

        if(mark_read_posts) {
            // Some events to mark and manipulate posts
            window.addEventListener('scroll', scroll_handler, true);
            document.addEventListener('mouseover', mouseover_handler, true);
        }

        document.addEventListener('reddit.urlChanged', onload, true);

        window.addEventListener('keyup', function(e) {
           if(e.key == "f" || e.key == "F" || e.key == "а" || e.key == "А") {
               remove_visited(true);
           }
        });

        // Register extension as JSAPI consumer.
        const meta = document.createElement('meta');
        meta.name = 'jsapi.consumer';
        meta.content = script_name;
        document.head.appendChild(meta);
        meta.dispatchEvent(new CustomEvent("reddit.ready"));
        console.log(script_name+' loaded');
        if(is_user) {
            //setTimeout(do_sidebar, 200);
        }
        let settings_div = document.createElement('div');
        settings_div.style.position = 'fixed';
        settings_div.style.right = '30px';
        settings_div.style.top = '120px';
        settings_div.style['z-index'] = '999';
        settings_div.innerHTML = '<button id="settings_div">open settings</button>';
        document.body.appendChild(settings_div);
        document.getElementById('settings_div').addEventListener('click', render_settings, true);
    };

    init();
})();
