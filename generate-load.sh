# To send 1000 different tenant ids (from [1,1000] range):
#   ./generate-load.sh 1 1000
#
for ((i = $1; i <= $2; i++)); do
	curl "http://localhost:3000/ping?id=${i}"
	echo ""
done