/**
 * ParseTable
 * @author brenthamby
 */

function ParseTable(opts){
	if(!opts.parseObjName || !opts.el){
		throw "ParseTable : provide parseObjName and el (where to put the thing)"
	}
	this.opts = {
		parseObjName : undefined, // name of Parse Class
		el : undefined, // element within which to place the table
		cols:[], // if not supplied will just derive order and names from server
		deletable : false, // if true, delete button will appear
		editable  : false, // if true, inline editting will appear
		displayInterceptors:{},
		updateInterceptors:{}
	}

	_.extend(this.opts,opts)
	_.templateSettings.variable = "rc";

	this.DOM; // DOM container
	this.id = Math.round(Math.random()*100000000);
	this.page=1;
	this.pageSize=1;
	this.sortBy;
	this.loading=false;
	this.editting=false;
	this.results; // parse results
	this.render();
}

ParseTable.prototype={
	spin:function(bool){
		this.loading=bool
		if(bool)
			$("#pt_controls_loading"+this.id).show()
		else
			$("#pt_controls_loading"+this.id).fadeOut()
	},
	next:function(e){
		if(this.loading) return
		this.page++;
		this.render()
	},
	prev:function(e){
		if(this.loading) return
		this.page--;
		this.render()
	},
	sort:function(e){
		if(this.loading) return

		// GO BACK TO PAGE 1, DOES NOT MAKE SENSE TO ORDER IN MIDDLE

		this.page=1;  
		this.sortBy=$(e.target).data("colname")
		var order = $(e.target).data("sortorder")
		this.sortOrder = (order === 'ascending') ? 'descending' : 'ascending'
		$("th").removeClass('pt_ascending').removeClass('pt_descending')
		$(e.target).addClass('pt_'+this.sortOrder)
		$(e.target).data("sortorder",this.sortOrder)
		this.render()
	},
	update:function(e){
		e.stopPropagation()
		this.editting=false
		if($(e.target).hasClass("js-cancel")){
			this.DOM.find(".pt_edit").remove()
		} else {
			var text = $(e.target).parent().find("textarea")
			var parseId = $(e.target).closest("tr").attr("id")
			var col = $(e.target).parent().parent().data("colname")  // ugg
			this.results[parseId].set(col, text.val());
			this.results[parseId].save(null,{
				success:function(){
					this.render()
				}.bind(this),
				error:function(obj){
					alert(obj.message)
					this.render()
				}.bind(this),
			})
		}
	},
	edit:function(e){
		e.preventDefault()
		if(this.loading || this.editting) return
		this.editting=true
		var target = $(e.target);
		var col = $(e.target).data("colname") 
		if(this.opts.updateInterceptors[col]){
			var parseId = $(e.target).closest("tr").attr("id")
			this.opts.updateInterceptors[col]({
				parseObj: this.results[parseId],
				col: col,
				el:target
			})
			this.editting=false
			return;
		}
		var editor = _.template(
			$( "script.pt_table_cell_edit" ).html()
		);
		var val = target.data("rawdata")
		target.append(editor({value:val}))
	},
	size:function(e){
		this.pageSize = ($(e.target).val())
		this.page=1 ; // FORCE TO BEGINNING IF RESIZING
		this.render()
	},
	del:function(e){
		if(this.loading) return
		this.spin(true);			
		var id = $(e.target).closest("tr").attr("id")
		this.results[id].destroy({
			success:function(){
				this.render()
			}.bind(this),
			error:function(obj){
				throw obj
				this.spin(false)
			}.bind(this)
		})
	},
	init:function(){


		var container = _.template(
			$( "script.pt_table_container" ).html()
		);

		// SET UP DOM AND DELEGATES

		this.DOM=$(container({id:this.id, deletable : this.opts.deletable }))
		this.opts.el.append(this.DOM)
		$(this.DOM).on("change","#pt_controls_size"+this.id,this.size.bind(this))
		$(this.DOM).on("click","#pt_controls_next"+this.id,this.next.bind(this))
		$(this.DOM).on("click","#pt_controls_prev"+this.id,this.prev.bind(this))
		$(this.DOM).on("click",".pt_edit button",this.update.bind(this))
		$(this.DOM).on("click","th",this.sort.bind(this))
		if(this.opts.editable)
			$(this.DOM).on("click","div.js-editable",this.edit.bind(this))
		if(this.opts.deletable)
			$(this.DOM).on("click","td.js-deletable",this.del.bind(this))

		this.pageSize=$("#pt_controls_size"+this.id).val();
		this.pObject=Parse.Object.extend(this.opts.parseObjName);
		this.query = new Parse.Query(this.pObject);

	},
	buildHeaders:function(rows){
		var headers = _.template(
			$( "script.pt_table_data_headers" ).html()
		);
		$("#pt_table"+this.id).html(
			headers({rows:rows, 
				cols:this.opts.cols, 
				editable:this.opts.editable,
				deletable:this.opts.deletable 
			}))
		this.headers=true;   
	},
	render: function(){
		this.spin(true);
		if(!this.DOM){
			this.init(); // ONE TIME CALL
		}
        
        this.query.limit(this.pageSize)

        if(this.page>1)
	        this.query.skip(this.pageSize*this.page)
	    
	    if(this.sortBy)
	    	if(this.sortOrder==='ascending')
		    	this.query.ascending(this.sortBy)
		    else 
		    	this.query.descending(this.sortBy)

        this.query.find({

            success: function(results) {
            	
            	this.results={}; // STORE THE RESULTS INDEXED BY ID

		       	var rows =[];

		       	if(!this.opts.cols.length) // IF NOT SET GO WITH ORDER FROM FIRST PASS
	            	for(var n in results[0].attributes) 
	            	    this.opts.cols.push(n)

   		        for(var i = 0; i<results.length; i++){
            		var atts=results[i].attributes;
            		this.results[results[i].id]=results[i];
            		var row={
	    				id:results[i].id,
	    				cells:[]
            		};
	            	for(var j=0; j<this.opts.cols.length; j++) {

	            		// CHECK INTERCEPTORS

	            		var rawData = atts[this.opts.cols[j]] ;

	            		if(typeof this.opts.displayInterceptors[this.opts.cols[j]]==="function"){	 
	            			var display = this.opts.displayInterceptors[this.opts.cols[j]](atts[this.opts.cols[j]])
		            	 	row.cells.push({
		            	 		display:display,
		            	 		rawdata:rawData,
		            	 		col:this.opts.cols[j]}) // HANDLE COMPLEXES
	            		 }else {
		            		row.cells.push({
		            			display:rawData,
		            			rawdata:rawData,
		            			col:this.opts.cols[j]})
		            	}
	            	}
	            	rows.push(row)
            	}
            	if(!this.headers)
            		this.buildHeaders(rows);           

            	// GOT THE MATRIX OF VALUES NOW MAKE HTML

				var data = _.template(
					$( "script.pt_table_data" ).html()
				);

				// PAGING BUTTON CONTROLS

				if(this.page==1)
					$("#pt_controls_prev"+this.id).hide()
				else
					$("#pt_controls_prev"+this.id).show()

				// IMPERFECT GUESS IF CURR PAGE IS LAST PAGE

				if(results.length<this.currLen)
					$("#pt_controls_next"+this.id).hide()
				else
					$("#pt_controls_next"+this.id).show()

				this.currLen=results.length
				
				$("#pt_table"+this.id).find("tbody").empty().html(
					data({rows:rows, 
						cols:this.opts.cols, 
						editable:this.opts.editable,
						deletable:this.opts.deletable 
					}))

				$("#pt_controls_page"+this.id).empty().html(this.page);

				this.spin(false)

            }.bind(this),
            error :function(o){
            	alert("there was an error returned:\n\n"+o.message)
            }
        }); // END FIND
	}
}





















