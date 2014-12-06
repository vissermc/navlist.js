/**
The MIT License (MIT)

Copyright (c) 2014 Michiel Visser

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
**/

if (typeof Object.create !== 'function') {
    Object.create = function (o) {
        function F() {}
        F.prototype = o;
        return new F();
    };
}

function ChainList(parent,compareFunc) {
	this._next=this._prev=this;
	this._parent=parent||this;
	this._list=this;
	this._length=0;
	this._compareFunc = compareFunc
}

ChainList.Link = function(prev, elem/*optional*/) { // A class captured in the ChainList namespace, which is also the base class of a Linked List
	var t=prev._next;
	prev._next=this;
	this._prev=prev;
	this._next=t;
	t._prev = this;
	this._elem=elem||this;
	this._list = prev._list;
	this._list._length++;
}

ChainList.Link.prototype={
	constructor: ChainList.Link,
	list: function() {
		return this._list;
	},
	parent: function() {
		return this._list._parent;
	},
	setParent: function(val) {
		_list._parent = val;
	},
	elem: function() { return this._elem; },
	node: function() { return this; },
	setElem: function(val) { this._elem = val; },
	first: function() { return this; },
	last: function() {
		return this._list._prev;
	},
	index: function(index) { return this.indexPos(index).node(); },
	indexOf: function(node) {
		var r = this.forEach(function(i,index,n) {
			if (n==node)
				return index;
		});
		return r==null? -1 : r;
	},
	next: function() { return this._next.node(); },
	prev: function() { return this._prev.node(); },
	takeRange: function(start,end) {
		start=start.first();
		if (start==end)
			return this;
		var last=end._prev;

		var myList=this._list;
		start.forEachTill(end, function(elem,index,node) {
			node._list._length--;
			node._list=myList;
			node._list._length++;
		});

		end._prev=start._prev;
		start._prev._next=end;

		var tn=this;
		tn._prev._next=start;
		start._prev = tn._prev;

		tn._prev = last;
		last._next = tn; 
		return last;
	},
	take: function(list) {
		return this.takeRange(list,list._list);
	},
	takeSome: function(list,count) {
		return this.takeRange(list,list.indexPos(count));
	},
	cloneRange: function(end) {
		var ll=this.list()._initClone();
		for(var n=this.first(); n!=end;n=n._next)
			ll.insert(n._elem);
		return ll;
	},
	cloneSome: function(count) {
		return this.cloneRange(this.indexPos(count));
	},
	shiftRange: function(end) {
		var ll=this.list()._initClone();
		ll.takeRange(this,end);
		return ll;
	},
	shiftSome: function(count) {
		return this.shiftRange(this.indexPos(count));
	},
	truncate: function() {
		return this.shiftRange(this._list);
	},
	shift: function() { return this.shiftSome(1).index(0); },
	slice: function(begin,end) {
		return this.indexPos(begin).cloneRange(end!=null?this.indexPos(end):this._list);
	},
	splice: function(index,cutCount,elemToInsert1) {
		var n=this.indexPos(index);
		var nn=n._next;
		var r=n.shiftSome(cutCount);
		nn.insertArray( Array.prototype.slice.call(arguments,2));
		return r;
	},
	remove: function() {
		return this.shiftSome(1).index(0);
	},
	pop: function() {
		return this.last().remove();
	},
	insert: function(elem) {
		return new ChainList.Link(this._prev,elem);
	},
	insertArray: function(elems) {
		var n=this;
		for(var i=0; i<elems.length; i++) {
			n=n.insert(elems[i])._next;
		}
	},
	unshift: function() {
		this.first().insertArray(arguments);
		return this._list._count;
	},
	push: function(elem) {
		this._list.insertArray(arguments);
		return this._list._count;
	},
	selfIndex: function() {
		return this._list.indexOf(this);
	},
	indexOfElem: function(elem) {
		var r= this.forEach(function(i,index,n) {
			if (i==elem)
				return index;
		});
		return r==null? -1 : r;
	},
	indexElem: function(index) { return this.indexPos(index).elem(); },
	lastIndexOfElem: function(elem) {
		this.forEachBack(function(i,index,n) {
			if (i==elem)
				return index;
		});
		return -1;
	},
	indexLink: function(index) {
		var s = this;
		if (index<0) {
			while(++index<=0) s=s._prev;
		} else
			while(--index>=0) s=s._next;
		return s;
	},
	indexPos: function(index) {
		var s;
		if (index<0) {
			s=this._prev;
			while(++index<0 && !s._isList) 
				s=s._prev;
		} else {
			s=this.first();
			while(--index>=0 && !s._isList) 
				s=s._next;
		}
		return s;
	},
	nextLink: function() { return this._next; },
	prevLink: function() { return this._prev; },
	countRange: function(end) { // counts the nunmber of successors
		var i = 0;
		for(var s=this._next;s!=end;s=s._next) 
			i++;
		return i;
	},
	isList: function() { return this._isList; },
	reverse: function() {
		var r=new ChainList(); // no need for _initClone
		while (!this._next._isList)
			r._next.takeSome(this,1);
		this.take(r);
		return this;
	},
	forEachTill: function (end, func/*(elem,index,Node): retVal*/) {
		var index=0;
		for(var s=this.first();s!=end;s=s._next) {
			var value=func.call(this,s._elem,index,s);
			if (value!==undefined)
				return value;
			index++;
		}
	},
	forEach: function (func/*(elem,index,Node): retVal*/) {
		return this.forEachTill(this.list(), func);
	},
	forEachBackRange: function (end, func/*(elem,index,Node): retVal*/) {
		var index=0; //this is faster than starting with calculating count
		for(var s=this._prev;s!=end;s=s._prev) {
			index--;
			var value=func.call(this,s._elem,index,s);
			if (value!==undefined)
				return value;
		}
	},
	forEachBack: function (func/*(elem,index,Node): retVal*/) {
		return this.forEachBackRange(this.list(), func);
	},
	map: function (func/*(elem,index,Node): retVal*/) {
		var index=0;
		var res=[];
		for(var s=this._next;!s._isList;s=s._next) {
			res.push(func(s._elem,index,s));
			index++;
		}
		return res;
	},
	toArray: function() {
		return this.map(function(elem) { return elem; });
	}
};

ChainList.Link.prototype.get = ChainList.Link.prototype.indexElem;

ChainList.prototype = Object.create (ChainList.Link.prototype);
ChainList.prototype.constructor = ChainList;
ChainList.prototype._isList = true;
ChainList.prototype.list = function() { return this; };
ChainList.prototype.empty = ChainList.Link.prototype.truncate;
ChainList.prototype.truncate = function() {}
ChainList.prototype.remove = null;
ChainList.prototype.count = function() { return this._length; }
ChainList.prototype.clone = function() { return this.cloneRange(this);};
ChainList.prototype.node = function() { return null; };
ChainList.prototype.first = function() { return this._next; };
ChainList.prototype.elem = function() { return null; };
ChainList.prototype.insertAt = function(index,elem) { return this.indexLink(index+1).insert(elem); } // 0 = begin, length or -1=end
ChainList.prototype.removeAt = function(index) { return this.indexPos(index).remove(); } // 0 = first, -1=last
ChainList.prototype._testInvariants = function() {
	var count=0;
	this.forEach(function(elem,index,node) {
		count++;
		assert(node._prev._next==node);
		assert(node._next._prev==node);
		assert(node._list==this);
		assert(node._isList==null);
	});
	assert_equal(count,this.count());
};

ChainList.prototype._initClone = function() { return new ChainList(); }

ChainList.fromArray = function(array,parent) {
	var ll = new ChainList(parent);
	ll.insertArray(array);
	return ll;
}

function ChainListSorted(parent,compareFunc) {
	ChainList.call(this,parent);
	this._compareFunc = compareFunc || (parent && parent.compareFunc) || ChainListSorted.defaultCompareFunc;
}

ChainListSorted.defaultCompareFunc = function(a,b) {
	return a-b;
}

ChainListSorted.prototype = Object.create (ChainList.prototype);
ChainListSorted.prototype.constructor = ChainListSorted;

ChainListSorted.prototype.insert = function(elem) {
	var node = this.forEach(function(e,index,node) {
		if (this._compareFunc(elem,e)<=0)
			return node;
	}) || this;
	return new ChainListSorted.Node(node._prev,elem);
};
ChainListSorted.prototype.insertAt = null; //disable

ChainListSorted.prototype.unshift = null; //disable

ChainListSorted.prototype.push = null; //disable

ChainListSorted.prototype._initClone = function() { return new ChainListSorted(null,this._compareFunc); }

ChainListSorted.fromArray = function(array,parent,compareFunc) {
	var ll = new ChainListSorted(parent,compareFunc);
	ll.insertArray(array);
	return ll;
}

ChainListSorted.Node = function(prev, elem) {
	ChainList.Link.call(this,prev,elem);
};

ChainListSorted.Node.prototype = Object.create (ChainList.Link.prototype);

ChainListSorted.Node.prototype.constructor = ChainListSorted.Node;

ChainListSorted.Node.prototype.insert = function(elem) {
	return this.list().insert(elem);
}
