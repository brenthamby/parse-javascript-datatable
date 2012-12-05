Parse.com Ajax Datatable
========================

This is a simple flexible library that allows you to view and edit your parse.com
data in a tabular format.  You can set the table to be editable and/or deletable.
For basic types the editing is very simple, you just click on the field and a little
editor appears.  For complex types and for large amounts of data in a single cell 
there are interceptor functions that allow you to handle the display of the data and 
the method for updating, e.g. for Date types you might intercept the up event and 
provide your favorite Datepicker.  Here is a quick run down of the features:

* pagable and sortable tabular interface
* interceptor design pattern for adding custom display and update features
* only 200 lines of code
* relies on jquery, underscore, underscore templates and of course parse


![table](http://www.brenthamby.com/dt.png)

This is the basic usage:
<pre>
	pt = new ParseTable({
		el : $("#table"), // where to place on the page (fills space)
		parseObjName : "NAME_OF_TABLE",
		deletable : true, //  defaults to false (allows deleting if true)
		editable : true,  //  defaults to false (allows editing if true)
	...
</pre>

By default it will inspect the table and present all of the columns for display and editing.  You can enforce order or omit columns using:

<pre>
	...
	cols : ['Street','City','State','PostalCode','Country'],
</pre>

What is really powerful is the interceptors which allow you to customize the way the data is displayed and the method and UI for editing the data. For instance you may want to shorten long text entries so as not to distort the table:

<pre>
	...
	displayInterceptors:{
		SOME_LONG_COLUMN : function(d){
			return d.substring(0,20)+"..."
		}
	},
 
</pre>

Or present a drop down list for some other enumerated column:

<pre>
	...
	editInterceptors:{
		State : function(obj){
			var target = obj.el;  // DOM ref to the cell
			var parseObj = obj.parseObj; // parse instance
			var col = obj.col;  // column name in question
			var val = target.data("rawdata"); // raw data (diff if was displayIntercepted)
			var myEdit = $("&lt;select class='pt_edit'&gt;&lt;option&gt;CA&lt;option&gt;NY&lt;option&gt;VT&lt;/select&gt;")
				.val(target.html().trim()).change(function(){
				parseObj.set(obj.col,$(this).val())
				parseObj.save()
				pt.editing=false	
				pt.render()
			})
			target.append(myEdit)
		}
	}

</pre>

### Authors and Contributors
@brenthamby
### Support or Contact
Having trouble with Pages? Check out the documentation at http://help.github.com/pages or contact support@github.com and we’ll help you sort it out.