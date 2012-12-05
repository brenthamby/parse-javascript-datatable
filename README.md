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
