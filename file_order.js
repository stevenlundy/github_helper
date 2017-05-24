function swapElements(el1, el2) {
    var temp = document.createElement('div');
    el1.parentNode.replaceChild(temp, el1);
    el2.parentNode.replaceChild(el1, el2);
    temp.parentNode.replaceChild(el2, temp);
}

function getPreviousSiblingWhere(el, filter) {
    while (el = el.previousElementSibling) {
        if (filter(el)) return el;
    }
}

function getNextSiblingWhere(el, filter) {
    while (el = el.nextElementSibling) {
        if (filter(el)) return el;
    }
}

function handleMoveFileUp(e) {
    var fileEl = e.target.closest('.file');
    moveFileUp(fileEl);
}

function handleMoveFileDown(e) {
    var fileEl = e.target.closest('.file');
    moveFileDown(fileEl);
}

function swapFileElements(fileEl1, fileEl2) {
    var anchorEl1 = fileEl1.previousElementSibling;
    var anchorEl2 = fileEl2.previousElementSibling;
    swapElements(fileEl1, fileEl2);
    swapElements(anchorEl1, anchorEl2);
    saveFileOrder();
}

function moveFileUp(fileEl) {
    var prevFileEl = getPreviousSiblingWhere(fileEl, function(el) {
        return el.classList.contains('file');
    });
    if (!prevFileEl) return;
    swapFileElements(fileEl, prevFileEl);
}

function moveFileDown(fileEl) {
    var nextFileEl = getNextSiblingWhere(fileEl, function(el) {
        return el.classList.contains('file');
    });
    if (!nextFileEl) return;
    swapFileElements(fileEl, nextFileEl);
}

function addClasses(el, ...classes) {
    classes.forEach(className => el.classList.add(className));
}

function createButton(text, tooltip, action) {
    var button = document.createElement('a');
    button.innerHTML = text;
    button.setAttribute('aria-label', tooltip);
    addClasses(button, "btn", "btn-sm", "tooltipped", "tooltipped-nw");
    button.addEventListener('click', action);
    return button;
}

function addOrderingButtons(toolbarEl) {
    if (toolbarEl.classList.contains('has-ordering-buttons')) return;
    var moveUpEl = createButton("Move up", "Move file up in file order", handleMoveFileUp);
    var moveDownEl = createButton("Move down", "Move file down in file order", handleMoveFileDown);
    toolbarEl.prepend(moveUpEl);
    toolbarEl.prepend(moveDownEl);
    toolbarEl.classList.add('has-ordering-buttons');
}

function getFileOrder() {
    var fileOrder = [];
    document.querySelectorAll('.file-header').forEach(function(file) {
        fileOrder.push(file.attributes['data-anchor'].value);
    });
    return fileOrder;
}

function putFilesInOrder(fileOrder) {
    fileOrder.reverse();
    fileOrder.forEach(function(anchorName) {
        var fileEl = document.querySelector(`[data-anchor=${anchorName}]`).closest('.file');
        var anchorEl = document.querySelector(`[name=${anchorName}]`);
        fileEl.parentNode.prepend(fileEl);
        anchorEl.parentNode.prepend(anchorEl);
    });
}

function saveFileOrder() {
    var key = getPageKey() + "__fileorder";
    var data = {};
    data[key] = getFileOrder();
    chrome.storage.sync.set(data, function () {});
}

function loadFileOrder() {
    var key = getPageKey() + "__fileorder";
    chrome.storage.sync.get(key, function(items) {
        if (items[key]) {
            putFilesInOrder(items[key]);
        }
    });
}

var pageInfo = {};
function setPageInfo() {
    var filesRE = /([\w-]+)\/([\w-]+)\/pull\/(\d+)\/files/g;
    var commitsRE = /([\w-]+)\/([\w-]+)\/pull\/(\d+)\/commits\/(\w+)/g;
    var path = window.location.pathname;
    var matches = filesRE.exec(path) || commitsRE.exec(path);
    if (matches) {
        pageInfo = {
            owner: matches[1],
            repo: matches[2],
            pr: matches[3],
            sha: matches[4]
        };
    } else {
        pageInfo = {};
    }
}

function getPageKey() {
    var key = `${pageInfo.owner}::${pageInfo.repo}::${pageInfo.pr}`;
    if (pageInfo.sha) {
        key += `::${pageInfo.sha}`;
    }
    return key;
}

document.querySelectorAll('.file-actions').forEach(addOrderingButtons);
setPageInfo();
loadFileOrder();

var observer = new MutationObserver(function (mutations) {
    document.querySelectorAll('.file-actions').forEach(addOrderingButtons);
    setPageInfo();
});

var config = { attributes: true, childList: true, characterData: true };

observer.observe(document.querySelector('#js-repo-pjax-container'), config);
