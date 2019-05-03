$(document).ready(function()
      {
        // transforma datele din XML in text
        function XMLToString(oXML)
        {
         //code for IE
         if (window.ActiveXObject) {
         var oString = oXML.xml; return oString;
         } 
         // code for Chrome, Safari, Firefox, Opera, etc.
         else {
         return (new XMLSerializer()).serializeToString(oXML);
         }
         }

         // transforma datele din TEXT in xml
        function StringToXML(oString) {
         //code for IE
         if (window.ActiveXObject) { 
         var oXML = new ActiveXObject("Microsoft.XMLDOM"); oXML.loadXML(oString);
         return oXML;
         }
         // code for Chrome, Safari, Firefox, Opera, etc. 
         else {
         return (new DOMParser()).parseFromString(oString, "text/xml");
         }
        }

        // POPULEAZA FORMULARUL html CU DATELE FILTRAE SI PROCESATE
        function populateData(info) {
          $(info).find('Valute').each(function(){
              var CharCode = $(this).find('CharCode').text();
              if ((CharCode == "EUR") || (CharCode == "USD") || (CharCode == "RUB") || (CharCode == "RON")) {
                var Value = $(this).find('Value').text();

                selectedValue[ CharCode ] = Value;

              }
            });

          var datas = selectedValue;

          var allEl = $('[id^="curs_"]');
          $.each(allEl, function( index, value ) {
            //alert( index + ": " + value );
            var elID = $(this).attr('id');
            //console.log(elID);
            if (elID.indexOf("USD") >= 0) {
              $("#curs_USD").val((Math.round(datas.USD * 100)/100).toFixed(2));
            }
            if (elID.indexOf("EUR") >= 0) {
              $("#curs_EUR").val((Math.round(datas.EUR * 100)/100).toFixed(2));
            }
            if (elID.indexOf("RUB") >= 0) {
              $("#curs_RUB").val((Math.round(datas.RUB * 100)/100).toFixed(2));
            }
            if (elID.indexOf("RON") >= 0) {
              $("#curs_RON").val((Math.round(datas.RON * 100)/100).toFixed(2));
            }
          });

        }

        // ia datele de la BNM
        function GetDataFromUninorte(successCallback, errorCallback) {
            $('html').LoadingOverlay("show");

            var currentDate = new Date();
            var month=((currentDate.getMonth()+1)>=10)? (currentDate.getMonth()+1) : '0' + (currentDate.getMonth()+1);  
            var day=((currentDate.getDate())>=10)? (currentDate.getDate()) : '0' + (currentDate.getDate());
            var year = currentDate.getFullYear();

            var cursDate = day + "." + month + "." + year;

            var url = "https://cors-anywhere.herokuapp.com/https://bnm.md/ro/official_exchange_rates?get_xml=1&date=" + cursDate;
            $.ajax({
              type: "GET",
              url: url,
              dataType: "xml",
              success: mySuccessCallback,
              error: myErrorCallback
            });
        }

        // prelucreaza datele BNM daca succes
        function mySuccessCallback(successResponse) {

            populateData(successResponse);

            successResponse = XMLToString(successResponse);
            localforage.setItem('cursValutar', successResponse).then(function (value) {
                //
            }).catch(function(err) {
                console.log(err);
            });
            $('html').LoadingOverlay("hide", true);
        }

        function myErrorCallback(successResponse) {
            GetDataFromUninorte(mySuccessCallback, myErrorCallback);
        }

        function mdlToValute(curs) {
          var resultUSD = parseFloat(curs, 10) / parseFloat(selectedValue.USD, 10);
          var resultEUR = parseFloat(curs, 10) / parseFloat(selectedValue.EUR, 10);
          var resultRON = parseFloat(curs, 10) / parseFloat(selectedValue.RON, 10);
          var resultRUB = parseFloat(curs, 10) / parseFloat(selectedValue.RUB, 10);

          $("#curs_USD").val((Math.round(resultUSD * 100)/100).toFixed(2));
          $("#curs_EUR").val((Math.round(resultEUR * 100)/100).toFixed(2));
          $("#curs_RON").val((Math.round(resultRON * 100)/100).toFixed(2));
          $("#curs_RUB").val((Math.round(resultRUB * 100)/100).toFixed(2));
        }


        function valuteToMdl(curs, startValute) {

          var valutesArray = ['USD', 'RON', 'RUB', 'EUR'];

          valutesArray = jQuery.grep(valutesArray, function(value) {
            return value != startValute;
          });

          var resultMDL = parseFloat(curs, 10) * parseFloat(selectedValue[startValute], 10);

          $("#curs_MDL").val((Math.round(resultMDL * 100)/100).toFixed(2));

          $.each(valutesArray, function( index, value ) {
            var valuteValue = parseFloat(resultMDL, 10) / parseFloat(selectedValue[value], 10);
            $("#curs_"+value).val((Math.round(valuteValue * 100)/100).toFixed(2));

          });

        }

        function populateDefault(startValute = null) {

          var valutesArray = ['USD', 'RON', 'RUB', 'EUR'];

          if (startValute == null) {
            $("#curs_MDL").val('');
            $.each(valutesArray, function( index, value ) {
              $("#curs_"+value).val((Math.round(selectedValue[value] * 100)/100).toFixed(2));
            });
          } else {
            if (startValute == 'MDL') {
              $.each(valutesArray, function( index, value ) {
                $("#curs_"+value).val((Math.round(selectedValue[value] * 100)/100).toFixed(2));
              });
            } else {
              valutesArray = jQuery.grep(valutesArray, function(value) {
                return value != startValute;
              });
              $("#curs_MDL").val('');
              $.each(valutesArray, function( index, value ) {
                $("#curs_"+value).val((Math.round(selectedValue[value] * 100)/100).toFixed(2));
              });
            }
          }
          
        }


        var selectedValue = {};

        localforage.getItem('cursValutar').then(function(value) {
            if (value == null) {
              GetDataFromUninorte(mySuccessCallback, myErrorCallback);
            } else {
              
              var string = value;
              value = StringToXML(value);
              
              var $doc = $.parseXML(string);
              var oldDate = $($doc).find('ValCurs').attr('Date');

              var currentDate = new Date();
              var month=((currentDate.getMonth()+1)>=10)? (currentDate.getMonth()+1) : '0' + (currentDate.getMonth()+1);  
              var day=((currentDate.getDate())>=10)? (currentDate.getDate()) : '0' + (currentDate.getDate());
              var year = currentDate.getFullYear();

              var cursDate = day + "." + month + "." + year;

              if (oldDate !== cursDate) {
                GetDataFromUninorte(mySuccessCallback, myErrorCallback);
              } else {
                populateData(value);
              }
              
            }
        }).catch(function(err) {
            // This code runs if there were any errors
            console.log(err);
            GetDataFromUninorte(mySuccessCallback, myErrorCallback);
        });

        // default data
        const obj = {
          mdl: '',
          usd: '',
          eur: '',
          rub: '',
          ron: ''
        };

        defi.on(obj, 'change:mdl', () => {
          mdlToValute(obj.mdl);
        });

        defi.on(obj, 'change:usd', () => {
          if (!obj.usd) {
            populateDefault('USD')
          } else {
            valuteToMdl(obj.usd, 'USD');
          }
        });
        defi.on(obj, 'change:eur', () => {
          if (!obj.eur) {
            populateDefault('EUR')
          } else {
            valuteToMdl(obj.eur, 'EUR');
          }
        });
        defi.on(obj, 'change:rub', () => {
          if (!obj.rub) {
            populateDefault('RUB')
          } else {
            valuteToMdl(obj.rub, 'RUB');
          }
        });
        defi.on(obj, 'change:ron', () => {
          if (!obj.ron) {
            populateDefault('RON')
          } else {
            valuteToMdl(obj.ron, 'RON');
          }
        });

        defi.bindNode(obj, {
          mdl: '#curs_MDL',
          usd: '#curs_USD',
          eur: '#curs_EUR',
          rub: '#curs_RUB',
          ron: '#curs_RON'
        });

        $("#reset").click(function(){
          populateDefault();
        });
        
        // log all IF doc ready remote data
        //console.log("doc ready");
      });