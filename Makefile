.SUFFIXES = .c .o .d
CC=gcc
#헤더파일 탐색할 디렉토리 # something require quotation mark "INC" such as VS
INC=F:\MinGW\msys\1.0\home\gmp-6.1.2
#LIBS=F:\Atmel\lib
#링크 디렉토리
LIBS=F:\MinGW\msys\1.0\home\gmp-6.1.2
CFLAGS=-g -Wall
OBJDIR=Debug
_OBJS=aes.o bignum256.o test_helpers.o endian.o hash.o \
	sha256.o ripemd160.o fix16.o baseconv.o fft.o \
	hmac_drbg.o ecdsa.o hmac_sha512.o messages.pb.o \
	pb_decode.o pb_encode.o pbkdf2.o bip32.o xex.o \
	prandom.o wallet.o transaction.o stream_comm.o

myOBJS= $(patsubst %,$(OBJDIR)/%,$(_OBJS))
C_DEPS +=  \
	aes.d \
	bignum256.d \
	test_helpers.d

SRCS = $(_OBJS:.o=.c)
TARGET=whole


blockFirst:
	@echo first target blocking

printVar: blockFirst
	@echo $<

move:
	@echo msg: move object files
	mv -v $(wildcard *.o) Debug

clean:
	rm -rf $(wildcard $(OBJDIR)/*.o)

depPrint: prandom.c
	gcc -M $< -o checkDep.d -I..
#gcc -M $< -o checkDep.d -I$(INC)

$(TARGET): $(_OBJS)
	$(CC) -g -o $@  $^ -L$(LIBS) -lgmp
# don't forget to set both -L(디렉토리위치) and -l(화일명)
# file name(화일명) looks like "lib화일명".
# so get rid of "lib" symbol and use only "화일명"

endian.o: endian.c
	$(CC) -g -c $< 

aes.o: aes.c
	$(CC) -g -c $<

bignum256.o: bignum256.c
	$(CC) -g -c $< -I$(INC)

test_helpers.o: test_helpers.c
	$(CC) -g -c $<

hash.o: hash.c
	$(CC) -g -c $<

sha256.o: sha256.c
	$(CC) -g -c $<

ripemd160.o: ripemd160.c
	$(CC) -g -c $<

fix16.o: fix16.c
	$(CC) -g -c $<

baseconv.o: baseconv.c
	$(CC) -g -c $<

fix16.o: fix16.c
	$(CC) -g -c $<

fft.o: fft.c
	$(CC) -g -c $<

hmac_drbg.o: hmac_drbg.c
	$(CC) -g -c $<

ecdsa.o: ecdsa.c
	$(CC) -g -c $<

hmac_sha512.o: hmac_sha512.c
	$(CC) -g -c $<

messages.pb.o: messages.pb.c
	$(CC) -g -c $<

pb_decode.o: pb_decode.c
	$(CC) -g -c $<

pb_encode.o: pb_encode.c
	$(CC) -g -c $<

pbkdf2.o: pbkdf2.c
	$(CC) -g -c $<

bip32.o: bip32.c
	$(CC) -g -c $<

transaction.o: transaction.c
	$(CC) -g -c $<

prandom.o: prandom.c
	$(CC) -g -c $<

xex.o: xex.c
	$(CC) -g -c $<

wallet.o: wallet.c
	$(CC) -g -c $<

stream_comm.o: stream_comm.c
	$(CC) -g -c $<





#%.o: %.c
#	$(CC) -g -c $< 

#allsrc: $(SRCS)
#	$(CC) -g -c $^ -I$(LIBS)\gmp\include
#allobj: $(_OBJS)
#	$(CC) -o start $^ -I$(LIBS)\gmp\include
# comments I find commnets symbol of MakeFile




%.o: %.c
	@echo test10
	$(CC) -g -o $@ ${CFLAG} -c $<
ppp: $(_OBJS)
	@echo $^

aaa: $(SRCS)
	$(CC) -g -Wall -o aaa -c $(SRCS) -L.

mytest: aes.o bignum256.o test_helpers.o
	$(CC) -o $@ $(foreach dirOBJS,$(OBJS),$(OBJDIR)/$(dirOBJS))

all: clean dep depPrint test


test6:
	@echo $(wildcard *.o)


test:
	@echo Building file: $@ $* $< $?

test7:
	@echo msg: easy compile
	gcc -o hi  $(SRCS)  -L.
	

test5:
	@echo msg: easy compile
	gcc -c $(SRCS)
	@echo msg: move object files
	mv -v $(wildcard *.o) Debug
	@echo msg: remove object files in current folder
	rm -rf $(wildcard *.o)
	@echo msg: linking object files
	$(CC) -include -o test5 

test1: $(SRCS)
	gcc -c $^ -o test $(_OBJS)

test4:
	gcc -g -o aa -c $(SRCS) -include

$(OUT): $(myOBJS)
	ar rvs $(OUT) $^

test2: $(OBJS)
	gcc $(CFLAGS) $(SRCS)

test3: $(OBJS)
	gcc -o $(OBJDIR)/$(TARGET) $(SRCS)

dep: 
	gccmakedep $(SRCS)

dirChange:
	cd debug ; $(MAKE)

dir:
	@echo $(foreach dirOBJS,$(OBJS),$(OBJDIR)/$(dirOBJS))



