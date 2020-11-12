from pytrends.request import TrendReq
import time

pytrends = TrendReq(hl='en-US', tz=360)
#pytrends = TrendReq(hl='en-US', tz=360, timeout=(10,25), retries=2, backoff_factor=0.1, requests_args={'verify':False})

file1 = open('C:/Users/ben_z/Desktop/5s_with_freebase.txt', 'r') 
Lines = file1.readlines() 
  
count = 0
# Strips the newline character 
for line in Lines: 
    tokens = line.split(";")
    if (len(tokens) != 2): 
        continue
    if (tokens[1] != "25\n"): 
        continue

    while True:
        try:
            kw_list = ["activ", tokens[0]]
            pytrends.build_payload(kw_list, cat=0, timeframe='all', geo='', gprop='')
            results = pytrends.interest_over_time()
            break
        except:
            time.sleep(60)

    file2 = open('C:/Users/ben_z/Desktop/trends_results.txt', 'a') 
    file2.write(tokens[0] + ";" + str(sum(results[tokens[0]].values)) + "\n")
    file2.close()