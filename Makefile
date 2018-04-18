.SUFFIXES = .c .o .d
CC=gcc
#헤더파일 탐색할 디렉토리
INC=F:\MinGW\msys\1.0\home\gmp-6.1.2
#LIBS=F:\Atmel\lib
#링크 디렉토리
LIBS=F:\MinGW\msys\1.0\home\gmp-6.1.2
CFLAGS=-g -Wall
OBJDIR=Debug
_OBJS=aes.o bignum256.o test_helpers.o endian.o
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

%_dbg.o: %.c
	$(CC) -g -o $@ ${CFLAG} -c $<

move:
	@echo msg: move object files
	mv -v $(wildcard *.o) Debug

clean:
	rm -rf $(wildcard $(OBJDIR)/*.o)

depPrint: bignum256.c
	gcc -M $< -o checkDep.d -I$(INC)

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



#%.o: %.c
#	$(CC) -g -c $< 

#allsrc: $(SRCS)
#	$(CC) -g -c $^ -I$(LIBS)\gmp\include
#allobj: $(_OBJS)
#	$(CC) -o start $^ -I$(LIBS)\gmp\include
# comments I find commnets symbol of MakeFile





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



